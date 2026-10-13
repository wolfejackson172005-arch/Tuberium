"""Check every system in presets/ against the spec.

Usage (from the repo root):
    pip install jsonschema
    python spec/validate.py

On top of the JSON Schema, it checks the rules a schema cannot:
  1. ids are unique (agents, lines, tasks)
  2. there is exactly one overseer
  3. every line connects two different, existing agents, and no pair is connected twice
  4. the overseer can reach every agent by following lines
  5. every {{key}} in a task goal is one of that task's inputs

It also prints warnings (not failures) for risky permission combos: an agent
that reads untrusted content (web pages, email) and can also act on its own
(send, post, run code). See docs/SAFETY.md, "Prompt injection".
"""

import json
import re
import sys
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parent.parent
SCHEMA = json.loads((ROOT / "spec" / "system.schema.json").read_text())
REF = re.compile(r"\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}")


def duplicates(values: list[str]) -> set[str]:
    return {v for v in values if values.count(v) > 1}


def neighbours(agent_id: str, lines: list[dict]) -> set[str]:
    """Agents that agent_id can start a conversation with."""
    out = set()
    for line in lines:
        if line["from"] == agent_id:
            out.add(line["to"])
        elif line["to"] == agent_id and line.get("twoWay", True):
            out.add(line["from"])
    return out


def check(system: dict) -> list[str]:
    errors = [
        f"schema: {'/'.join(map(str, e.path)) or '<root>'}: {e.message}"
        for e in Draft202012Validator(SCHEMA).iter_errors(system)
    ]
    if errors:
        return errors

    agents, lines, tasks = system["agents"], system["lines"], system["tasks"]
    ids = [a["id"] for a in agents]

    for label, values in (
        ("agent", ids),
        ("line", [l["id"] for l in lines]),
        ("task", [t["id"] for t in tasks]),
    ):
        for dup in duplicates(values):
            errors.append(f"duplicate {label} id: {dup}")

    overseers = [a["id"] for a in agents if a["kind"] == "overseer"]
    if len(overseers) != 1:
        errors.append(f"needs exactly one overseer, found {len(overseers)}")

    pairs = []
    for line in lines:
        for end in ("from", "to"):
            if line[end] not in ids:
                errors.append(f"line {line['id']}: unknown agent '{line[end]}'")
        if line["from"] == line["to"]:
            errors.append(f"line {line['id']}: connects an agent to itself")
        pairs.append("|".join(sorted((line["from"], line["to"]))))
    for dup in duplicates(pairs):
        errors.append(f"two lines connect the same pair: {dup.replace('|', ' and ')}")
    if errors:
        return errors

    reached, stack = {overseers[0]}, [overseers[0]]
    while stack:
        for nxt in neighbours(stack.pop(), lines):
            if nxt not in reached:
                reached.add(nxt)
                stack.append(nxt)
    for agent_id in ids:
        if agent_id not in reached:
            errors.append(f"agent {agent_id}: the overseer has no way to reach it")

    for task in tasks:
        keys = {f["key"] for f in task.get("inputs", [])}
        for ref in REF.findall(task["goal"]):
            if ref not in keys:
                errors.append(f"task {task['id']}: goal uses {{{{{ref}}}}} but there is no input called '{ref}'")
    return errors


UNTRUSTED_INPUT = {"web", "readEmail"}
POWERFUL_ACTION = {"sendEmail", "postSocial", "runCode", "submitForms", "trade"}


def warnings(system: dict) -> list[str]:
    """Risky but legal: reads untrusted content AND can act without asking."""
    out = []
    for agent in system.get("agents", []):
        perms = agent.get("permissions", {})
        reads = sorted(p for p in UNTRUSTED_INPUT if perms.get(p, "off") != "off")
        acts = sorted(p for p in POWERFUL_ACTION if perms.get(p) == "allow")
        if reads and acts:
            out.append(
                f"agent {agent['id']}: reads untrusted content ({', '.join(reads)}) and can "
                f"{', '.join(acts)} without asking. Set those to 'ask' or split into two agents."
            )
    return out


def main() -> int:
    failed = False
    for path in sorted((ROOT / "presets").glob("*.json")):
        system = json.loads(path.read_text())
        errors = check(system)
        print(f"{'FAIL' if errors else 'ok  '} {path.name}")
        for error in errors:
            print(f"       {error}")
        if not errors:
            for warning in warnings(system):
                print(f"  warn {warning}")
        failed = failed or bool(errors)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
