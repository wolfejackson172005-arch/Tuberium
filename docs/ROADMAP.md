# Roadmap

Each milestone ends with something you can demo. Finish one before starting the next. Branch per milestone, merge and tag when it's done (`m0`, `m1`...).

## Where this is going

Near term: a portfolio piece showing front-end, back-end and agentic AI work in one project. Long term: maybe a product.

The agent-builder space is crowded (n8n, Zapier, Make, Gumloop, Lindy, Relay), and most of those tools are built for technical users with steep learning curves. Tuberium's edge is the opposite end: **you can see exactly what every agent is doing and allowed to do, and it's fun**. Build toward that. Don't chase feature parity.

## M0: The map comes alive (fake agents)

Goal: open Hello Tubes, press Run, watch the overseer plan, travelers move along lines, progress bars fill. No AI, no API key.

- [ ] GitHub repo with the starter kit committed
- [ ] Safety setup: `backend/.env` from the template, pre-commit installed (see [SAFETY.md](SAFETY.md))
- [ ] Backend: FastAPI, spec models, `GET /systems/{id}`
- [ ] Engine with FakeRunner, scripted run following the event table
- [ ] `POST /runs` and `GET /runs/{id}/events` (SSE)
- [ ] Frontend: app shell (sidebar, top bar) and a map that draws homes and paths from the spec, plus your home next to the overseer
- [ ] Status card above every home: icon, name, progress bar with step count, "doing" line; permission badges
- [ ] Everything styled through the Tuberian theme pack (CSS variables, emoji art), aiming at `docs/img/tuberian-reference.png`
- [ ] Click an agent: panel with name, connections, permissions, agent, purpose, work history
- [ ] Run button: statuses and progress bars update live; travelers walk the paths with speech bubbles and files
- [ ] Stretch: preset picker (any file in `presets/` runs on the fake engine), second theme (Swamp) and a theme switcher

Step-by-step prompts: [M0-prompts.md](M0-prompts.md).

## M1: Real agents

Goal: Hello Tubes runs on Claude.

- [ ] `ClaudeRunner` with the Claude Agent SDK, one session per agent per run
- [ ] Toolkit: `talk_to` (line-checked), `report_progress`, overseer's `plan_road`, `review`, `finish`
- [ ] Inputs form before an on-demand run
- [ ] Result shows on the You circle; cost per agent and per run
- [ ] Switch between FakeRunner and ClaudeRunner with `TUBERIUM_RUNNER` in `backend/.env`
- [ ] Every agent's instructions say that content from emails, web pages and files is data, never instructions

## M2: Control

Goal: nothing an agent does surprises you.

- [ ] Permissions enforced: off removes tools, ask pauses for approval, allow runs
- [ ] Approval cards on the You circle; approve or deny from the map
- [ ] Badges light up when a permission is being used (`agent.action`)
- [ ] Blocked messages shown as a red flash
- [ ] Limits enforced: turns, agent cost, task cost, daily cost
- [ ] Each system gets its own workspace folder; file tools can't leave it
- [ ] Pause, play and stop on live runs

**M0 to M2 is a complete demo.** Record a 60-second video here.

## M3: Builder and Custom

Goal: build your own system without touching JSON.

- [ ] Add agents from the library, delete them, drag homes around
- [ ] Draw lines by dragging from home to home; toggle one-way; delete
- [ ] Edit everything in the agent panel: name, purpose, permissions, model, limits
- [ ] Save, load, rename, duplicate systems (SQLite)
- [ ] Validation shown on the map (unreachable agent, missing overseer...)
- [ ] "New system": pick a preset or Custom
- [ ] Import and export system JSON

## M4: Tasks and triggers

- [ ] Several tasks per system, each with its own button or schedule
- [ ] Scheduled tasks (APScheduler)
- [ ] Always-on tasks: watchers for new email, new file, web change
- [ ] Work history saved for good; history tab in the agent panel; Logs page listing every run
- [ ] Replay any past run on the map, with fast-forward

## M5: Themes

- [ ] Theme switcher, choice remembered
- [ ] All five: Tuberian, Business Professional, Factory, Jungle, Swamp (see [THEMES.md](THEMES.md))
- [ ] Line styles and traveler animations per theme
- [ ] Real art for Tuberian

## M6: Presets and connections

- [ ] All seven presets in a gallery (see [PRESETS.md](PRESETS.md))
- [ ] Gmail connection for read and send email
- [ ] File upload and download for file inputs and outputs
- [ ] Market data and social platform connections (official APIs only)
- [ ] Brokerage connection with the trade guard: paper mode first, caps enforced, live only by your `.env` switch
- [ ] Form submitting for job applications, with a screenshot of each filled form shown before you approve

## M7: Smarter overseer

- [ ] Suggestion cards: accept applies the change to the spec, reject dismisses
- [ ] Overseer reviews past runs and spots patterns ("Writer gets sent back 60% of the time: tighten its purpose?")
- [ ] Progress estimates based on earlier runs of the same task

## M8: Learn mode

The "learn how agentic AI works" part of the vision.

- [ ] Toggle that narrates each event in plain words ("The overseer just planned a road: Researcher first, then Writer.")
- [ ] Tooltips on concepts: agent, tool, permission, overseer, line
- [ ] A guided first run for new users

## Later, if it becomes a product

- Desktop app (runs in the system tray so always-on tasks keep going) or hosted web app
- Accounts, billing, per-user spend caps
- Runners for other models
- Community presets and themes
- Talk to 10 real beginners before building any of this
