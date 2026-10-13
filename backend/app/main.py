"""Tuberium API entrypoint."""

from collections.abc import AsyncIterator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.engine.engine import Engine
from app.models import System
from app.presets import is_valid_id, list_systems, load_system
from app.runners.base import Runner
from app.runners.fake import FakeRunner
from app.runs import RunStore
from app.settings import get_settings

settings = get_settings()


def make_runner() -> Runner:
    if settings.tuberium_runner == "claude":
        from app.runners.claude import ClaudeRunner

        return ClaudeRunner(settings.workspaces_path, settings.tuberium_default_model)
    return FakeRunner()


runner = make_runner()

app = FastAPI(title="Tuberium")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.tuberium_allowed_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

runs = RunStore()


class StartRun(BaseModel):
    systemId: str
    taskId: str
    inputs: dict[str, str] = {}


class RunStarted(BaseModel):
    runId: str


def make_engine() -> Engine:
    return Engine(runner)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "runner": settings.tuberium_runner}


class SystemSummary(BaseModel):
    id: str
    name: str
    description: str | None = None


@app.get("/systems")
async def get_systems() -> list[SystemSummary]:
    return [SystemSummary(id=s.id, name=s.name, description=s.description) for s in list_systems()]


@app.get("/systems/{system_id}", response_model=System, response_model_exclude_none=True)
async def get_system(system_id: str) -> System:
    system = load_system(system_id)
    if system is None:
        raise HTTPException(status_code=404, detail="System not found")
    return system


@app.post("/runs")
async def start_run(body: StartRun) -> RunStarted:
    system = load_system(body.systemId)
    if system is None:
        raise HTTPException(status_code=404, detail="System not found")
    if system.task(body.taskId) is None:
        raise HTTPException(status_code=400, detail="This system has no task with that id")
    record = runs.start(make_engine(), system, body.taskId, body.inputs)
    return RunStarted(runId=record.run_id)


@app.get("/runs/{run_id}/events")
async def run_events(run_id: str) -> StreamingResponse:
    record = runs.get(run_id) if is_valid_id(run_id) else None
    if record is None:
        raise HTTPException(status_code=404, detail="Run not found")

    async def stream() -> AsyncIterator[str]:
        async for event in record.follow():
            yield f"data: {event.model_dump_json()}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
