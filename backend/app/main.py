"""Tuberium API entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.settings import get_settings

settings = get_settings()

app = FastAPI(title="Tuberium")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.tuberium_allowed_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "runner": settings.tuberium_runner}
