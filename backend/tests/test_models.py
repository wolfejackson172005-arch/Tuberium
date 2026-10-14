import copy
from typing import Any

import pytest
from pydantic import ValidationError

from app.models import Agent, System
from app.presets import PRESETS_DIR, is_valid_id, load_system

PRESET_IDS = sorted(p.stem for p in PRESETS_DIR.glob("*.json"))


@pytest.mark.parametrize("system_id", PRESET_IDS)
def test_every_preset_loads(system_id: str) -> None:
    system = load_system(system_id)
    assert system is not None
    assert system.id == system_id


def test_new_agents_default_to_every_permission_off() -> None:
    agent = Agent.model_validate(
        {
            "id": "helper",
            "name": "Helper",
            "kind": "agent",
            "purpose": "Helps.",
            "permissions": {},
            "position": {"x": 0, "y": 0},
        }
    )
    assert set(agent.permissions.model_dump().values()) == {"off"}


def _broken(spec: dict[str, Any], change: str) -> dict[str, Any]:
    spec = copy.deepcopy(spec)
    if change == "two overseers":
        spec["agents"][1]["kind"] = "overseer"
    elif change == "no overseer":
        spec["agents"][0]["kind"] = "agent"
    elif change == "duplicate agent id":
        spec["agents"][2]["id"] = spec["agents"][1]["id"]
    elif change == "agent called you":
        spec["agents"][1]["id"] = "you"
    elif change == "line to unknown agent":
        spec["lines"][0]["to"] = "nobody"
    elif change == "line to itself":
        spec["lines"][0]["to"] = spec["lines"][0]["from"]
    elif change == "unknown field":
        spec["surprise"] = True
    elif change == "unknown permission level":
        spec["agents"][1]["permissions"] = {"web": "sometimes"}
    return spec


@pytest.mark.parametrize(
    "change",
    [
        "two overseers",
        "no overseer",
        "duplicate agent id",
        "agent called you",
        "line to unknown agent",
        "line to itself",
        "unknown field",
        "unknown permission level",
    ],
)
def test_invalid_systems_are_rejected(hello_spec: dict[str, Any], change: str) -> None:
    with pytest.raises(ValidationError):
        System.model_validate(_broken(hello_spec, change))


@pytest.mark.parametrize("value", ["hello-tubes", "a", "abc-123"])
def test_safe_ids(value: str) -> None:
    assert is_valid_id(value)


@pytest.mark.parametrize("value", ["", "../presets", "..", "Hello", "-lead", "a/b", "a\\b", "a.json", "a b"])
def test_unsafe_ids_never_reach_the_filesystem(value: str) -> None:
    assert not is_valid_id(value)
    assert load_system(value) is None
