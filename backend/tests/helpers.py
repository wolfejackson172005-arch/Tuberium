import asyncio
import json
from typing import Any

from app.engine.engine import Engine
from app.engine.events import RunEvent
from app.models import System
from app.presets import PRESETS_DIR


def read_preset(system_id: str) -> dict[str, Any]:
    return json.loads((PRESETS_DIR / f"{system_id}.json").read_text(encoding="utf-8"))


def collect(engine: Engine, system: System, task_id: str, inputs: dict[str, str] | None = None) -> list[RunEvent]:
    """Run a task to the end and return every event it emitted."""

    async def go() -> list[RunEvent]:
        return [event async for event in engine.run(system, task_id, inputs or {})]

    return asyncio.run(go())
