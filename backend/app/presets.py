"""Load preset systems from presets/ at the repo root."""

import json
import re
from pathlib import Path

from app.models import SLUG_PATTERN, System

PRESETS_DIR = Path(__file__).resolve().parents[2] / "presets"
_SLUG = re.compile(SLUG_PATTERN)


def is_valid_id(value: str) -> bool:
    return bool(_SLUG.fullmatch(value))


def preset_path(system_id: str) -> Path | None:
    """The preset file for system_id, or None if the id is unsafe or missing."""
    if not is_valid_id(system_id):
        return None
    path = PRESETS_DIR / f"{system_id}.json"
    return path if path.is_file() else None


def load_system(system_id: str) -> System | None:
    path = preset_path(system_id)
    if path is None:
        return None
    return System.model_validate(json.loads(path.read_text(encoding="utf-8")))


def list_systems() -> list[System]:
    return [
        System.model_validate(json.loads(p.read_text(encoding="utf-8")))
        for p in sorted(PRESETS_DIR.glob("*.json"))
    ]
