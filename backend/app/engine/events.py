"""Run events: the contract between the engine and the map (see docs/ARCHITECTURE.md)."""

from typing import Any, Literal

from pydantic import BaseModel

EventType = Literal[
    "run.started",
    "overseer.plan",
    "agent.status",
    "agent.action",
    "message.sent",
    "message.blocked",
    "approval.requested",
    "approval.resolved",
    "overseer.review",
    "overseer.suggestion",
    "run.paused",
    "run.resumed",
    "run.finished",
]

AgentStatus = Literal["idle", "working", "traveling", "waiting", "done", "failed"]


class RunEvent(BaseModel):
    runId: str
    seq: int
    ts: str
    type: EventType
    data: dict[str, Any]


class Draft(BaseModel):
    """An event a runner wants emitted. The engine stamps runId, seq and ts."""

    type: EventType
    data: dict[str, Any]


class Reply(BaseModel):
    """The last thing a runner's turn yields: what the agent answers."""

    text: str
    files: list[str] = []
