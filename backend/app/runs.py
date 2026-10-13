"""In-memory runs: every event so far, plus a way to wait for the next one. No database yet."""

import asyncio
import uuid
from collections.abc import AsyncIterator

from app.engine.engine import Engine
from app.engine.events import RunEvent
from app.models import System


class RunRecord:
    def __init__(self, run_id: str) -> None:
        self.run_id = run_id
        self.events: list[RunEvent] = []
        self.finished = False
        self._changed = asyncio.Condition()

    async def add(self, event: RunEvent) -> None:
        async with self._changed:
            self.events.append(event)
            if event.type == "run.finished":
                self.finished = True
            self._changed.notify_all()

    async def finish(self) -> None:
        async with self._changed:
            self.finished = True
            self._changed.notify_all()

    async def follow(self) -> AsyncIterator[RunEvent]:
        """Every event already recorded, then new ones as they arrive, until the run finishes."""
        sent = 0
        while True:
            async with self._changed:
                await self._changed.wait_for(lambda: len(self.events) > sent or self.finished)
                pending = self.events[sent:]
                done = self.finished
            for event in pending:
                yield event
            sent += len(pending)
            if done and sent == len(self.events):
                return


class RunStore:
    def __init__(self) -> None:
        self._runs: dict[str, RunRecord] = {}
        self._tasks: set[asyncio.Task[None]] = set()

    def get(self, run_id: str) -> RunRecord | None:
        return self._runs.get(run_id)

    def start(self, engine: Engine, system: System, task_id: str, inputs: dict[str, str]) -> RunRecord:
        record = RunRecord(uuid.uuid4().hex[:12])
        self._runs[record.run_id] = record

        async def drive() -> None:
            try:
                async for event in engine.run(system, task_id, inputs, run_id=record.run_id):
                    await record.add(event)
            finally:
                await record.finish()

        task = asyncio.create_task(drive())
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)
        return record
