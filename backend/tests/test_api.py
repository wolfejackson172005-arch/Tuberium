import json
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app import main
from app.runners.fake import FakeRunner


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    monkeypatch.setattr(main, "runner", FakeRunner(min_delay=0, max_delay=0))
    with TestClient(main.app) as client:
        yield client


def read_stream(client: TestClient, run_id: str) -> list[dict[str, object]]:
    events = []
    with client.stream("GET", f"/runs/{run_id}/events") as response:
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")
        for line in response.iter_lines():
            if line.startswith("data: "):
                events.append(json.loads(line.removeprefix("data: ")))
    return events


def test_health_reports_the_fake_runner(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok", "runner": "fake"}


def test_lists_every_preset(client: TestClient) -> None:
    ids = {s["id"] for s in client.get("/systems").json()}
    assert {"hello-tubes", "inbox-helper", "custom"} <= ids


def test_gets_one_system(client: TestClient) -> None:
    body = client.get("/systems/hello-tubes").json()
    assert body["id"] == "hello-tubes"
    assert any(line.get("twoWay") is False for line in body["lines"])


@pytest.mark.parametrize("system_id", ["nope", "Hello-Tubes", "..%2Fbackend%2F.env", "hello_tubes"])
def test_unknown_or_unsafe_systems_are_404(client: TestClient, system_id: str) -> None:
    assert client.get(f"/systems/{system_id}").status_code == 404


def test_start_run_rejects_unknown_system_and_task(client: TestClient) -> None:
    assert client.post("/runs", json={"systemId": "nope", "taskId": "x"}).status_code == 404
    assert client.post("/runs", json={"systemId": "hello-tubes", "taskId": "x"}).status_code == 400


def test_run_streams_to_the_end_and_replays(client: TestClient) -> None:
    started = client.post("/runs", json={"systemId": "hello-tubes", "taskId": "fun-fact", "inputs": {"topic": "squid"}})
    assert started.status_code == 200
    run_id = started.json()["runId"]

    live = read_stream(client, run_id)
    assert live[0]["type"] == "run.started"
    assert live[-1]["type"] == "run.finished"
    assert "squid" in live[-1]["data"]["result"]

    replay = read_stream(client, run_id)
    assert [e["seq"] for e in replay] == [e["seq"] for e in live]


@pytest.mark.parametrize("run_id", ["nope", "NOPE", "a.b"])
def test_unknown_runs_are_404(client: TestClient, run_id: str) -> None:
    assert client.get(f"/runs/{run_id}/events").status_code == 404
