import os

# Set before any app import: an env var beats backend/.env, so tests can never reach a real model.
os.environ["TUBERIUM_RUNNER"] = "fake"

from typing import Any

import pytest

from app.models import System
from tests.helpers import read_preset


@pytest.fixture
def hello_spec() -> dict[str, Any]:
    return read_preset("hello-tubes")


@pytest.fixture
def hello(hello_spec: dict[str, Any]) -> System:
    return System.model_validate(hello_spec)
