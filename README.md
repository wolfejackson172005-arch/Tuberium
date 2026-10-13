# Tuberium

A game-like, themed map of an AI agent team. Agents live in houses, paths show who can talk to who, an overseer manages everything, and you watch them travel, work and ask permission live.

![Tuberian reference art](docs/img/tuberian-reference.png)

**Status:** pre-M0. The repo holds the design docs, the system spec and nine preset systems. See [docs/ROADMAP.md](docs/ROADMAP.md).

## Read these first

| Doc | What's in it |
|---|---|
| [VISION.md](docs/VISION.md) | What Tuberium is. The source of truth. |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | The five rules, the run events, backend and frontend shape |
| [system-spec.md](docs/system-spec.md) | The JSON format for a system: agents, lines, tasks, permissions |
| [THEMES.md](docs/THEMES.md) | Tuberian, Business Professional, Factory, Jungle, Swamp |
| [PRESETS.md](docs/PRESETS.md) | The seven presets, Custom, and the agent library |
| [SAFETY.md](docs/SAFETY.md) | API keys and `.env`, blocking leaks, prompt injection, the safety checklist |
| [ROADMAP.md](docs/ROADMAP.md) | Milestones as checklists |
| [M0-prompts.md](docs/M0-prompts.md) | Step-by-step Cursor prompts for the first milestone |

## Stack

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript + Vite, React Flow (`@xyflow/react`) |
| Backend | Python + FastAPI |
| Agents | Claude Agent SDK (`claude-agent-sdk`), behind a swappable Runner |
| Storage | SQLite |
| Live updates | Server-Sent Events |
| Schedules | APScheduler |

## Repo layout

```
tuberium/
  README.md
  docs/              vision, architecture, spec, themes, presets, safety, roadmap, M0 prompts
    img/             reference art
  spec/
    system.schema.json
    validate.py      checks every file in presets/
  presets/           one JSON file per preset system
  .cursor/rules/     keeps Cursor on the architecture
  .cursorignore      files Cursor's AI may never read (secrets, your data)
  .pre-commit-config.yaml   blocks commits containing keys or .env files
  backend/           .env.example now; the rest is created in M0
  frontend/          created in M0
```

## Building it with Cursor

1. **The docs are the memory.** `.cursor/rules/tuberium.mdc` makes every Cursor chat follow the vision and architecture, so you never re-explain the idea.
2. **One step per chat.** Work one milestone at a time, starting with [M0-prompts.md](docs/M0-prompts.md). A fresh chat per step keeps Cursor focused.
3. **Plan, build, check, commit.** Have Cursor plan the bigger steps before coding. Run each step's check yourself. Commit only when it passes.
4. **Ideas change the docs first.** Update `docs/VISION.md`, then the other docs, then the code.
5. **Branch per milestone.** Merge and tag when it's done (`m0`, `m1`...), so there's always a working version to demo.

## Safety first (once, before any code)

```powershell
copy backend\.env.example backend\.env
pip install pre-commit
pre-commit install
```

Keys go in `backend/.env` only, which git and Cursor both ignore. Every commit is scanned for keys. Details and the "if a key leaks" steps: [SAFETY.md](docs/SAFETY.md).

## Running it (once M0 is built)

Backend, from `backend/`:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

On macOS or Linux, use `python3 -m venv .venv` and `source .venv/bin/activate` for the first two lines.

Frontend, from `frontend/`:

```powershell
npm install
npm run dev
```

Open http://localhost:5173.

## Claude setup (from M1 on)

M0 runs on fake agents and needs no API key.

1. Get an API key from the [Claude Console](https://platform.claude.com/).
2. In the backend venv: `pip install claude-agent-sdk` (Python 3.10+). It bundles the Claude Code binary it drives, so there's normally nothing else to install.
3. Put the key in `backend/.env` (`ANTHROPIC_API_KEY=...`) and set `TUBERIUM_RUNNER=claude`. The SDK doesn't read `.env` files on its own; `backend/app/settings.py` (built in M0 step 1) loads it at startup. Set a monthly spend limit on the key in the Console too.

Products built on the Agent SDK have to use API key auth. Anthropic doesn't allow offering claude.ai login in a third-party product without prior approval.

## Checking the spec

```powershell
pip install jsonschema
python spec/validate.py
```
