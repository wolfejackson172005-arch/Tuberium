"""Run a preset task on the fake engine and print every event.

Usage, from backend/:  python scripts/try_run.py [systemId] [taskId]
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.engine.engine import Engine  # noqa: E402
from app.presets import load_system  # noqa: E402
from app.runners.fake import FakeRunner  # noqa: E402


def short(data: dict[str, object]) -> str:
    parts = []
    for key, value in data.items():
        text = str(value)
        parts.append(f"{key}={text[:50] + '...' if len(text) > 50 else text}")
    return " ".join(parts)


async def main(system_id: str, task_id: str) -> int:
    system = load_system(system_id)
    if system is None:
        print(f"No preset called {system_id}")
        return 1
    engine = Engine(FakeRunner(min_delay=0.05, max_delay=0.1))
    async for event in engine.run(system, task_id, {}):
        print(f"{event.seq:>3} {event.type:<16} {short(event.data)}")
    return 0


if __name__ == "__main__":
    args = sys.argv[1:]
    sys.exit(asyncio.run(main(args[0] if args else "hello-tubes", args[1] if len(args) > 1 else "fun-fact")))
