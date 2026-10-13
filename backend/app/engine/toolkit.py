"""Tools the engine gives every agent. Each one goes through the engine, so it becomes an event."""

from typing import TYPE_CHECKING

from app.models import Agent, System

if TYPE_CHECKING:
    from app.engine.engine import Engine, RunContext


class Toolkit:
    def __init__(
        self,
        engine: "Engine",
        ctx: "RunContext",
        agent: Agent,
        caller: str | None,
        depth: int,
    ) -> None:
        self._engine = engine
        self._ctx = ctx
        self.agent = agent
        self.caller = caller
        self.depth = depth

    @property
    def system(self) -> System:
        return self._ctx.system

    @property
    def road(self) -> list[str]:
        """Agent ids in the order the overseer planned, empty before plan_road."""
        return list(self._ctx.road)

    async def talk_to(self, agent_id: str, message: str, files: list[str] | None = None) -> str:
        return await self._engine.talk(
            self._ctx, self.agent.id, agent_id, message, files or [], self.depth
        )

    async def report_progress(self, step: int, steps: int, doing: str) -> None:
        await self._ctx.emit(
            "agent.status",
            {
                "agentId": self.agent.id,
                "status": "working",
                "doing": doing,
                "step": step,
                "steps": steps,
            },
        )

    async def plan_road(self, steps: list[dict[str, str]]) -> None:
        self._require_overseer()
        self._ctx.road = [s["agentId"] for s in steps]
        await self._ctx.emit("overseer.plan", {"steps": steps})

    async def review(self, agent_id: str, verdict: str, note: str) -> None:
        self._require_overseer()
        await self._ctx.emit(
            "overseer.review", {"agentId": agent_id, "verdict": verdict, "note": note}
        )

    def _require_overseer(self) -> None:
        if self.agent.kind != "overseer":
            raise PermissionError("Only the overseer can use this tool")
