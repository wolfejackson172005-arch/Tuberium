"""FakeRunner: a scripted, offline runner that works for any system in presets/."""

import asyncio
import random
from collections.abc import AsyncIterator

from app.engine.engine import can_talk
from app.engine.events import Draft, Reply
from app.engine.toolkit import Toolkit
from app.models import Agent, System

ACTION_LABELS: dict[str, str] = {
    "web": "Searching the web",
    "readFiles": "Reading holdings.csv",
    "writeFiles": "Writing notes.md",
    "runCode": "Running clean_data.py",
    "readEmail": "Reading 12 new emails",
    "sendEmail": "Preparing an email",
    "postSocial": "Preparing a post",
    "submitForms": "Filling in a form",
    "trade": "Preparing a paper trade",
}


def plan_road(system: System) -> list[Agent]:
    """Every agent the overseer can reach by following lines, closest first."""
    start = system.overseer.id
    order: list[str] = []
    seen = {start}
    frontier = [start]
    while frontier:
        nxt: list[str] = []
        for current in frontier:
            for agent in system.agents:
                if agent.id not in seen and can_talk(system, current, agent.id):
                    seen.add(agent.id)
                    order.append(agent.id)
                    nxt.append(agent.id)
        frontier = nxt
    return [a for a in (system.agent(i) for i in order) if a is not None]


class FakeRunner:
    def __init__(self, min_delay: float = 0.5, max_delay: float = 1.0) -> None:
        self.min_delay = min_delay
        self.max_delay = max_delay

    async def _pause(self) -> None:
        if self.max_delay > 0:
            await asyncio.sleep(random.uniform(self.min_delay, self.max_delay))

    async def turn(self, agent: Agent, message: str, kit: Toolkit) -> AsyncIterator[Draft | Reply]:
        if agent.kind == "overseer":
            async for item in self._overseer_turn(agent, message, kit):
                yield item
        else:
            async for item in self._agent_turn(agent, message, kit):
                yield item

    async def _overseer_turn(self, agent: Agent, goal: str, kit: Toolkit) -> AsyncIterator[Draft | Reply]:
        yield Draft(
            type="agent.status",
            data={"agentId": agent.id, "status": "working", "doing": "Reading the task"},
        )
        await self._pause()

        road = plan_road(kit.system)
        await kit.plan_road(
            [{"agentId": a.id, "job": f"{a.name}: do your part of the task"} for a in road]
        )
        await self._pause()

        steps = len(road)
        for i, worker in enumerate(road, start=1):
            await kit.report_progress(i, steps, f"Waiting on {worker.name}")
            await self._pause()
            await kit.talk_to(worker.id, f"Your part of the task: {goal}")
            await self._pause()
            await kit.review(worker.id, "accepted", "Looks good.")
            await self._pause()

        await kit.report_progress(steps, steps, "Wrapping up")
        await self._pause()
        yield Reply(text=f"Done (fake run). The team worked on: {goal}")

    async def _agent_turn(self, agent: Agent, message: str, kit: Toolkit) -> AsyncIterator[Draft | Reply]:
        allowed = [name for name, level in agent.permissions.model_dump().items() if level == "allow"]
        steps = 3 if allowed else 2

        await self._pause()
        await kit.report_progress(1, steps, "Reading the job")
        await self._pause()

        for permission in allowed:
            yield Draft(
                type="agent.action",
                data={"agentId": agent.id, "permission": permission, "label": ACTION_LABELS[permission]},
            )
            await self._pause()
        if allowed:
            await kit.report_progress(2, steps, ACTION_LABELS[allowed[0]])
            await self._pause()

        if kit.caller == kit.system.overseer.id:
            road = kit.road
            later = road[road.index(agent.id) + 1 :] if agent.id in road else []
            target = next((t for t in later if can_talk(kit.system, agent.id, t)), None)
            if target is not None:
                await kit.talk_to(target, "Here's my part", files=[f"{agent.id}-notes.md"])
                await self._pause()

        await kit.report_progress(steps, steps, "Writing my reply")
        await self._pause()
        yield Reply(text=f"{agent.name} here: my part is done.")
