"""Runs a task: the line guard and the event bus. Never imports a model SDK."""

import asyncio
import logging
import re
import uuid
from collections.abc import AsyncIterator
from datetime import datetime, timezone
from typing import Any

from app.engine.events import Draft, EventType, Reply, RunEvent
from app.engine.toolkit import Toolkit
from app.models import Agent, Line, System
from app.runners.base import Runner

log = logging.getLogger(__name__)

MAX_DEPTH = 4
_INPUT_REF = re.compile(r"\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}")


def find_line(system: System, from_id: str, to_id: str) -> Line | None:
    """The line that lets from_id START a conversation with to_id, if any."""
    for line in system.lines:
        if line.from_ == from_id and line.to == to_id:
            return line
        if line.twoWay and line.from_ == to_id and line.to == from_id:
            return line
    return None


def can_talk(system: System, from_id: str, to_id: str) -> bool:
    return find_line(system, from_id, to_id) is not None


def fill_goal(goal: str, inputs: dict[str, str]) -> str:
    return _INPUT_REF.sub(lambda m: inputs.get(m.group(1), m.group(0)), goal)


class RunContext:
    def __init__(self, run_id: str, system: System, queue: "asyncio.Queue[RunEvent | None]") -> None:
        self.run_id = run_id
        self.system = system
        self.road: list[str] = []
        self.busy: set[str] = set()
        self.costs: dict[str, float] = {}
        self._queue = queue
        self._seq = 0

    def cost(self, agent_id: str) -> float:
        return round(self.costs.get(agent_id, 0.0), 6)

    @property
    def total_cost(self) -> float:
        return round(sum(self.costs.values(), 0.0), 6)

    async def emit(self, type: EventType, data: dict[str, Any]) -> RunEvent:
        self._seq += 1
        event = RunEvent(
            runId=self.run_id,
            seq=self._seq,
            ts=datetime.now(timezone.utc).isoformat(),
            type=type,
            data=data,
        )
        await self._queue.put(event)
        return event


class Engine:
    def __init__(self, runner: Runner) -> None:
        self.runner = runner

    async def run(
        self,
        system: System,
        task_id: str,
        inputs: dict[str, str],
        run_id: str | None = None,
    ) -> AsyncIterator[RunEvent]:
        task = system.task(task_id)
        if task is None:
            raise ValueError(f"Unknown task: {task_id}")
        values = {f.key: f.default or "" for f in task.inputs}
        values.update(inputs)
        goal = fill_goal(task.goal, values)

        queue: asyncio.Queue[RunEvent | None] = asyncio.Queue()
        ctx = RunContext(run_id or uuid.uuid4().hex[:12], system, queue)

        async def drive() -> None:
            try:
                await ctx.emit("run.started", {"taskId": task_id})
                overseer = system.overseer
                reply = await self._turn(ctx, overseer, goal, caller=None, depth=0)
                await ctx.emit(
                    "agent.status",
                    {"agentId": overseer.id, "status": "done", "costUsd": ctx.cost(overseer.id)},
                )
                await ctx.emit(
                    "run.finished",
                    {"status": "done", "result": reply.text, "costUsd": ctx.total_cost},
                )
            except Exception:
                log.exception("Run %s failed", ctx.run_id)
                await ctx.emit(
                    "run.finished",
                    {
                        "status": "failed",
                        "result": "The run stopped because of an error.",
                        "costUsd": ctx.total_cost,
                    },
                )
            finally:
                try:
                    await self.runner.close_run(ctx.run_id)
                except Exception:
                    log.exception("Run %s: the runner failed to clean up", ctx.run_id)
                await queue.put(None)

        driver = asyncio.create_task(drive())
        try:
            while (event := await queue.get()) is not None:
                yield event
        finally:
            if not driver.done():
                driver.cancel()

    async def talk(
        self,
        ctx: RunContext,
        from_id: str,
        to_id: str,
        text: str,
        files: list[str],
        depth: int,
    ) -> str:
        line = find_line(ctx.system, from_id, to_id)
        target = ctx.system.agent(to_id)
        if line is None or target is None:
            reason = f"No line lets {from_id} start a talk with {to_id}"
            await ctx.emit("message.blocked", {"from": from_id, "to": to_id, "reason": reason})
            return f"Refused: {reason}."
        if depth >= MAX_DEPTH:
            reason = f"Conversations can only nest {MAX_DEPTH} deep"
            await ctx.emit("message.blocked", {"from": from_id, "to": to_id, "reason": reason})
            return f"Refused: {reason}."
        if to_id in ctx.busy:
            reason = f"{to_id} is already busy in this conversation; answer in your reply instead"
            await ctx.emit("message.blocked", {"from": from_id, "to": to_id, "reason": reason})
            return f"Refused: {reason}."

        await ctx.emit(
            "message.sent",
            {"lineId": line.id, "from": from_id, "to": to_id, "text": text, "files": files, "isReply": False},
        )
        reply = await self._turn(ctx, target, text, caller=from_id, depth=depth + 1)
        await ctx.emit(
            "agent.status", {"agentId": to_id, "status": "done", "costUsd": ctx.cost(to_id)}
        )
        await ctx.emit(
            "message.sent",
            {
                "lineId": line.id,
                "from": to_id,
                "to": from_id,
                "text": reply.text,
                "files": reply.files,
                "isReply": True,
            },
        )
        return reply.text

    async def _turn(
        self, ctx: RunContext, agent: Agent, message: str, caller: str | None, depth: int
    ) -> Reply:
        kit = Toolkit(self, ctx, agent, caller, depth)
        reply = Reply(text="")
        ctx.busy.add(agent.id)
        try:
            async for item in self.runner.turn(agent, message, kit):
                if isinstance(item, Draft):
                    await ctx.emit(item.type, item.data)
                else:
                    reply = item
        finally:
            ctx.busy.discard(agent.id)
        return reply
