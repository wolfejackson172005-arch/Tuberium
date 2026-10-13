"""The Runner protocol: the only way the engine gets an agent to think."""

from collections.abc import AsyncIterator
from typing import Protocol

from app.engine.events import Draft, Reply
from app.engine.toolkit import Toolkit
from app.models import Agent


class Runner(Protocol):
    def turn(self, agent: Agent, message: str, kit: Toolkit) -> AsyncIterator[Draft | Reply]:
        """The agent handles one incoming message. It may call tools from `kit`,
        including talk_to(), which the engine routes. The last item is its Reply."""
        ...
