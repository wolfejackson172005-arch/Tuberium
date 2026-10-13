"""Pydantic models mirroring spec/system.schema.json. Keep the two in step."""

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

SLUG_PATTERN = r"^[a-z0-9][a-z0-9-]*$"

Slug = Annotated[str, Field(pattern=SLUG_PATTERN)]
Level = Literal["off", "ask", "allow"]
PermissionName = Literal[
    "web",
    "readFiles",
    "writeFiles",
    "runCode",
    "readEmail",
    "sendEmail",
    "postSocial",
    "submitForms",
    "trade",
]


class SpecModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class Position(SpecModel):
    x: float
    y: float


class Permissions(SpecModel):
    web: Level = "off"
    readFiles: Level = "off"
    writeFiles: Level = "off"
    runCode: Level = "off"
    readEmail: Level = "off"
    sendEmail: Level = "off"
    postSocial: Level = "off"
    submitForms: Level = "off"
    trade: Level = "off"


class Limits(SpecModel):
    maxTurns: Annotated[int, Field(ge=1)] | None = None
    maxCostUsd: Annotated[float, Field(gt=0)] | None = None
    maxTradeUsd: Annotated[float, Field(gt=0)] | None = None


class Agent(SpecModel):
    id: Slug
    name: Annotated[str, Field(min_length=1)]
    kind: Literal["overseer", "agent"]
    template: str | None = None
    purpose: Annotated[str, Field(min_length=1, max_length=600)]
    model: str | None = None
    permissions: Permissions
    limits: Limits | None = None
    position: Position


class Line(SpecModel):
    id: Slug
    from_: Slug = Field(alias="from")
    to: Slug
    twoWay: bool = True


class InputField(SpecModel):
    key: Annotated[str, Field(pattern=r"^[a-zA-Z][a-zA-Z0-9_]*$")]
    label: str
    kind: Literal["text", "longtext", "file"]
    default: str | None = None


class ManualTrigger(SpecModel):
    type: Literal["manual"]


class ScheduleTrigger(SpecModel):
    type: Literal["schedule"]
    cron: str
    timezone: str


class AlwaysTrigger(SpecModel):
    type: Literal["always"]
    watch: Literal["newEmail", "newFile", "webChange"]
    checkEveryMinutes: Annotated[int, Field(ge=1)]


Trigger = Annotated[
    ManualTrigger | ScheduleTrigger | AlwaysTrigger,
    Field(discriminator="type"),
]


class Task(SpecModel):
    id: Slug
    name: Annotated[str, Field(min_length=1)]
    goal: str
    inputs: list[InputField] = []
    trigger: Trigger
    maxCostUsd: Annotated[float, Field(gt=0)] | None = None


class System(SpecModel):
    specVersion: Literal["0.2"]
    id: Slug
    name: Annotated[str, Field(min_length=1)]
    description: str | None = None
    preset: str | None = None
    agents: Annotated[list[Agent], Field(min_length=1)]
    lines: list[Line]
    tasks: list[Task]

    @model_validator(mode="after")
    def check_rules(self) -> "System":
        ids = [a.id for a in self.agents]
        if "you" in ids:
            raise ValueError('"you" is reserved for the human circle')
        if len(set(ids)) != len(ids):
            raise ValueError("agent ids must be unique")
        overseers = [a.id for a in self.agents if a.kind == "overseer"]
        if len(overseers) != 1:
            raise ValueError(f"needs exactly one overseer, found {len(overseers)}")
        known = set(ids)
        for line in self.lines:
            for end in (line.from_, line.to):
                if end not in known:
                    raise ValueError(f"line {line.id}: unknown agent '{end}'")
            if line.from_ == line.to:
                raise ValueError(f"line {line.id}: connects an agent to itself")
        return self

    @property
    def overseer(self) -> Agent:
        return next(a for a in self.agents if a.kind == "overseer")

    def agent(self, agent_id: str) -> Agent | None:
        return next((a for a in self.agents if a.id == agent_id), None)

    def task(self, task_id: str) -> Task | None:
        return next((t for t in self.tasks if t.id == task_id), None)
