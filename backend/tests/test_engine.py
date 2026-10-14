from collections.abc import AsyncIterator, Awaitable, Callable

import pytest

from app.engine.engine import Engine
from app.engine.events import Draft, Reply, RunEvent
from app.engine.toolkit import Toolkit
from app.models import Agent, System
from app.runners.fake import FakeRunner
from tests.helpers import collect, read_preset

Script = Callable[[Agent, str, Toolkit], Awaitable[str]]


class ScriptedRunner:
    """Each agent's turn runs a small script, so a test can make agents misbehave on purpose."""

    def __init__(self, scripts: dict[str, Script]) -> None:
        self.scripts = scripts
        self.closed: list[str] = []

    async def close_run(self, run_id: str) -> None:
        self.closed.append(run_id)

    async def turn(self, agent: Agent, message: str, kit: Toolkit) -> AsyncIterator[Draft | Reply]:
        script = self.scripts.get(agent.id)
        text = await script(agent, message, kit) if script else "ok"
        yield Reply(text=text)


def of_type(events: list[RunEvent], type_: str) -> list[RunEvent]:
    return [e for e in events if e.type == type_]


def fake() -> Engine:
    return Engine(FakeRunner(min_delay=0, max_delay=0))


def test_fake_run_follows_the_documented_order(hello: System) -> None:
    events = collect(fake(), hello, "fun-fact")

    assert events[0].type == "run.started"
    assert events[-1].type == "run.finished"
    assert events[-1].data["status"] == "done"
    assert [e.seq for e in events] == list(range(1, len(events) + 1))
    assert len({e.runId for e in events}) == 1

    types = [e.type for e in events]
    assert types.index("overseer.plan") < types.index("message.sent")


def test_every_message_gets_a_reply(hello: System) -> None:
    sent = of_type(collect(fake(), hello, "fun-fact"), "message.sent")
    asks = [(e.data["from"], e.data["to"]) for e in sent if not e.data["isReply"]]
    replies = [(e.data["to"], e.data["from"]) for e in sent if e.data["isReply"]]
    assert asks
    assert sorted(asks) == sorted(replies)


def test_messages_only_travel_on_real_lines(hello: System) -> None:
    line_ids = {line.id for line in hello.lines}
    for event in of_type(collect(fake(), hello, "fun-fact"), "message.sent"):
        assert event.data["lineId"] in line_ids


def test_task_inputs_fill_the_goal(hello: System) -> None:
    default = collect(fake(), hello, "fun-fact")
    custom = collect(fake(), hello, "fun-fact", {"topic": "squid"})
    assert "octopuses" in default[-1].data["result"]
    assert "squid" in custom[-1].data["result"]


def test_costs_are_reported_per_agent_and_per_run(hello: System) -> None:
    events = collect(fake(), hello, "fun-fact")
    done = [e for e in of_type(events, "agent.status") if e.data["status"] == "done"]
    assert {e.data["agentId"] for e in done} == {"overseer", "researcher", "writer"}
    assert all(e.data["costUsd"] == 0 for e in done)
    assert events[-1].data["costUsd"] == 0


@pytest.mark.parametrize("system_id", ["inbox-helper", "investments", "data-cleanup"])
def test_bigger_presets_finish(system_id: str) -> None:
    system = System.model_validate(read_preset(system_id))
    task_id = system.tasks[0].id
    events = collect(fake(), system, task_id)
    assert events[-1].data["status"] == "done"


def test_talking_without_a_line_is_blocked(hello: System) -> None:
    async def overseer(agent: Agent, message: str, kit: Toolkit) -> str:
        return await kit.talk_to("writer", "Go")

    async def writer(agent: Agent, message: str, kit: Toolkit) -> str:
        # The researcher -> writer line is one-way, so the writer can't start this talk.
        return await kit.talk_to("researcher", "Got any facts?")

    events = collect(Engine(ScriptedRunner({"overseer": overseer, "writer": writer})), hello, "fun-fact")

    blocked = of_type(events, "message.blocked")
    assert [(e.data["from"], e.data["to"]) for e in blocked] == [("writer", "researcher")]
    assert not any(
        e.data["from"] == "writer" and e.data["to"] == "researcher" for e in of_type(events, "message.sent")
    )
    assert events[-1].data["status"] == "done"


def test_talking_to_a_busy_agent_is_blocked(hello: System) -> None:
    async def overseer(agent: Agent, message: str, kit: Toolkit) -> str:
        return await kit.talk_to("researcher", "Find a fact")

    async def researcher(agent: Agent, message: str, kit: Toolkit) -> str:
        # The overseer is still waiting on this reply, so talking back would deadlock.
        return await kit.talk_to("overseer", "Quick question")

    events = collect(Engine(ScriptedRunner({"overseer": overseer, "researcher": researcher})), hello, "fun-fact")

    blocked = of_type(events, "message.blocked")
    assert len(blocked) == 1
    assert "busy" in blocked[0].data["reason"]


def test_only_the_overseer_can_plan(hello: System) -> None:
    async def overseer(agent: Agent, message: str, kit: Toolkit) -> str:
        return await kit.talk_to("researcher", "Plan for me")

    async def researcher(agent: Agent, message: str, kit: Toolkit) -> str:
        await kit.plan_road([{"agentId": "writer", "job": "Everything"}])
        return "planned"

    events = collect(Engine(ScriptedRunner({"overseer": overseer, "researcher": researcher})), hello, "fun-fact")

    assert not of_type(events, "overseer.plan")
    assert events[-1].data["status"] == "failed"


def test_the_runner_is_cleaned_up_after_every_run(hello: System) -> None:
    async def overseer(agent: Agent, message: str, kit: Toolkit) -> str:
        raise RuntimeError("boom")

    runner = ScriptedRunner({"overseer": overseer})
    events = collect(Engine(runner), hello, "fun-fact")

    assert events[-1].data["status"] == "failed"
    assert runner.closed == [events[0].runId]


def test_unknown_task_is_refused(hello: System) -> None:
    with pytest.raises(ValueError):
        collect(fake(), hello, "no-such-task")
