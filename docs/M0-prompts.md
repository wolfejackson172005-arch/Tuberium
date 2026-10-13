# M0: the map comes alive, step by step

Goal: open Hello Tubes, press Run, and watch it play out like `docs/img/tuberian-reference.png`: the overseer plans, critters walk the paths with speech bubbles and files, status cards fill up. All fake: no AI, no API key, no database.

## How to use this file

- One step per Cursor chat. Start a fresh chat for each step so Cursor stays focused.
- Use Cursor's agent mode. For the bigger steps (3, 5, 8), ask it to plan first and read the plan before letting it code.
- Paste the prompt, read what it writes, run the **Check**. Don't move on until the check passes.
- Commit after every passing step.
- **Explain it**: answer in your own words before moving on. If you can't, ask Cursor to walk you through its code. That's what keeps your skills sharp, and it's what an interviewer will ask you.
- `.cursor/rules/tuberium.mdc` already tells Cursor to read the docs, so the prompts don't repeat the architecture.

Commands are for Windows PowerShell. On macOS or Linux, use `python3` instead of `py` and `source .venv/bin/activate` to activate the venv.

---

## Step 0: Repo (no Cursor needed)

**Set up with `TUBERIUM_KIT.md` and Cursor?** Then Step 0 is already done. Run the check at the end of this step and go to Step 1.

1. Create an empty repo named `tuberium` on GitHub (no README, no .gitignore; the kit has both).
2. Clone it and unzip the starter kit into it so `README.md` sits at the top:

```powershell
git clone https://github.com/<you>/tuberium.git
cd tuberium
# unzip tuberium-starter.zip here
```

Already committed yesterday's kit? Delete `docs/`, `spec/`, `examples/`, `.cursor/` and `README.md` first, then unzip this one.

3. Safety setup, before the first commit so that commit gets scanned too (details in [SAFETY.md](SAFETY.md)). M0 needs no API key; leave `ANTHROPIC_API_KEY` empty.

```powershell
copy backend\.env.example backend\.env
pip install pre-commit
pre-commit install
```

4. Commit and push:

```powershell
git add .
git commit -m "Add starter kit: vision, architecture, spec, presets, safety"
git push
```

5. Open the folder in Cursor.

**Check:**

```powershell
pip install jsonschema
python spec/validate.py
```

prints `ok` for nine preset files, and `pre-commit run --all-files` passes. `git status` does not list `backend/.env`. On GitHub, `docs/VISION.md` shows your reference image and `docs/ARCHITECTURE.md` shows a diagram.

---

## Step 1: Backend says hello

```text
Create the backend in backend/.

- backend/requirements.txt with fastapi, uvicorn[standard], python-dotenv and pydantic-settings
- backend/app/__init__.py
- backend/app/settings.py: loads backend/.env with python-dotenv (so the variables are also in os.environ for SDKs that read them), then exposes a Settings object for every variable in backend/.env.example. If TUBERIUM_RUNNER is "claude" and ANTHROPIC_API_KEY is empty, raise a clear error at startup. The key must never appear in logs, errors or API responses: use SecretStr.
- backend/app/main.py: FastAPI app with GET /health returning {"status": "ok", "runner": <runner name>}. CORS allows only settings.TUBERIUM_ALLOWED_ORIGIN.

Follow docs/SAFETY.md. Nothing else yet. Then give me the exact commands to create a venv, install, and run it on Windows PowerShell, bound to 127.0.0.1 (no --host 0.0.0.0).
```

**Check:** http://localhost:8000/health shows `{"status":"ok","runner":"fake"}`; http://localhost:8000/docs shows the API page. Set `TUBERIUM_RUNNER=claude` in `.env` with no key: the backend refuses to start with a clear message. Set it back to `fake`.

**Explain it:** What is CORS, and why will the frontend need it? Why does the key live in the backend and never in the frontend?

---

## Step 2: The spec as Python models

```text
Create backend/app/models.py: Pydantic v2 models that mirror spec/system.schema.json exactly (read docs/system-spec.md).

- System, Agent, Permissions, Limits, Line, Task, InputField, Position
- Trigger as a discriminated union on `type`: manual, schedule, always
- Permission levels as Literal["off", "ask", "allow"], every permission defaulting to "off"
- Line.twoWay defaults to True
- extra="forbid" everywhere, same as the schema
- JSON field names stay camelCase (specVersion, twoWay, maxCostUsd, checkEveryMinutes)
- A model validator on System for the rules the schema can't express, matching spec/validate.py: exactly one overseer, lines point at real agents, no agent called "you"

Then add GET /systems/{system_id} to main.py: load presets/{system_id}.json from the repo root, validate it through System, return it. 404 if missing. system_id must match ^[a-z0-9][a-z0-9-]*$ so nobody can read other files.
```

**Check:** http://localhost:8000/systems/hello-tubes returns the JSON. `/systems/nope` returns 404. Break `presets/hello-tubes.json` on purpose (change the writer's `kind` to `overseer`), reload, see an error about two overseers, then undo it.

**Explain it:** What does a discriminated union buy you for triggers? What would go wrong without one?

---

## Step 3: The fake engine

```text
Build the run engine with a fake runner. Follow rules 2 to 4 and the run events table in docs/ARCHITECTURE.md exactly.

backend/app/engine/events.py
- RunEvent: runId, seq, ts, type, data. The engine stamps runId, seq and ts.

backend/app/engine/engine.py
- Engine.run(system, task_id, inputs) -> AsyncIterator[RunEvent]
- can_talk(system, from_id, to_id): True if a line allows from_id to START a conversation with to_id (respect twoWay=false)
- talk(from_id, to_id, text, files): if can_talk is False, emit message.blocked and return a refusal. Otherwise emit message.sent, let the target agent take its turn through the runner, emit the reply as message.sent with isReply=true, and return the reply.

backend/app/runners/base.py
- Runner Protocol with turn(agent, message, kit) -> AsyncIterator[RunEvent]

backend/app/runners/fake.py
- FakeRunner. It must work for ANY system in presets/, not just Hello Tubes:
  - Overseer turn: status working "Reading the task". Emit overseer.plan with a road: every agent the overseer can reach, closest first, each with a one-line job. Then for each agent on the road: kit.talk_to(agent, job), update its own step count (step i of N, doing "Waiting on <name>"), emit overseer.review accepted. Finally finish with a canned result.
  - Other agents: 2 or 3 steps with report_progress (step, steps, doing). For every permission set to "allow", emit agent.action with a believable label (web: "Searching the web", readFiles: "Reading holdings.csv", ...). If the agent has a line it can start toward an agent that is LATER on the road, hand that agent a file: talk_to(that agent, "Here's my part", files=["<something>.md"]). Then reply with a canned sentence.
  - Sleep 0.5 to 1.0 seconds between events so the map has time to animate.

backend/scripts/try_run.py
- Runs hello-tubes, task fun-fact, through the engine with FakeRunner and prints each event on one line: seq, type, short data.
```

**Check:** `python scripts/try_run.py` from `backend/` shows, in order: `run.started`, `overseer.plan`, the overseer messaging the Researcher, the Researcher's steps and a web `agent.action`, the Researcher handing a file to the Writer, the Writer's reply, the Researcher's reply to the overseer, a review, the same for the Writer, `run.finished`. `seq` counts up with no gaps. Then change `try_run.py` to run `inbox-helper` / `watch-inbox`: it should also work.

**Explain it:** Where exactly is the "no line, no talking" rule enforced, and why does it matter that it's there and not in the runner?

---

## Step 4: Runs over HTTP

```text
Expose runs through the API. In memory only, no database.

- POST /runs with body {systemId, taskId, inputs}: load the system, start Engine.run with FakeRunner as a background asyncio task, return {"runId": "..."} right away. 400 if the task doesn't exist.
- Each run keeps every event so far in a list.
- GET /runs/{run_id}/events: Server-Sent Events (StreamingResponse, media type text/event-stream). Replay every event already recorded, then stream new ones as they happen, then close after run.finished. Format: `data: <json>\n\n`. 404 for an unknown run.

The replay matters: the browser may connect after the run has started or reconnect halfway.
```

**Check:** on http://localhost:8000/docs, call `POST /runs` with `{"systemId": "hello-tubes", "taskId": "fun-fact", "inputs": {}}` and copy the `runId`. In a second terminal:

```powershell
curl.exe -N http://localhost:8000/runs/<runId>/events
```

Events stream in. Run it again after it finishes: the whole run replays instantly and the connection closes.

**Explain it:** How is SSE different from a normal request? Why not WebSockets here?

---

## Step 5: The map

Create the app yourself first, from the repo root:

```powershell
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install @xyflow/react
npm run dev
```

Then drag `docs/img/tuberian-reference.png` into the Cursor chat with this prompt:

```text
Build the app shell and the map. Read the "Frontend shape" section of docs/ARCHITECTURE.md. The image is the look we're heading toward, but this step is layout and structure only; plain colors are fine.

- src/spec/types.ts: TypeScript types mirroring spec/system.schema.json.
- src/api.ts: getSystem(id). Base URL from import.meta.env.VITE_API_URL, default http://localhost:8000. That is the only frontend env variable; anything starting with VITE_ ends up in the browser, so no secrets ever go in frontend env files.
- src/shell/: a left Sidebar (Home, Agents, Tasks, Logs, Settings; only Home works for now) and a TopBar (app name, current time, run status text, and pause, play, fast-forward buttons that do nothing yet).
- src/map/Map.tsx: React Flow filling the rest of the screen. Turns spec agents into nodes at their positions and spec lines into edges. Also adds a "You" node 160px to the left of the overseer, connected to it by a line. "You" is NOT added to the spec.
- src/map/AgentHome.tsx: custom node. A fixed 96x96 round home with an emoji in the middle (🏛️ for the overseer, 🏠 for agents, 🧑 for You) and the name underneath. One invisible source Handle and one invisible target Handle, both centered, only so React Flow accepts the edges.
- src/map/PathEdge.tsx: custom edge drawn as a straight, thick path with rounded caps, from the edge of one home to the edge of the other (center + 48px toward the other home). Use useInternalNode to get node positions, like React Flow's floating edges example. One-way lines get a small arrowhead at the `to` end.
- App.tsx loads "hello-tubes" and renders the shell and map. Show a friendly message if the backend isn't running.

Declare nodeTypes and edgeTypes outside components. Import "@xyflow/react/dist/style.css". Remove the Vite demo content.
```

**Check:** http://localhost:5173 shows the sidebar, the top bar, and four homes: You, Overseer, Researcher, Writer. Paths meet the edge of each home, not the middle. The Researcher-to-Writer path has an arrowhead pointing at the Writer. Drag a home: its paths follow. Stop the backend and refresh: friendly message, not a blank page.

**Explain it:** Why does the map convert spec agents into React Flow nodes instead of storing React Flow's format in the spec?

---

## Step 6: Tuberian theme and status cards

Drag the reference image into the chat again:

```text
Make the map look like the reference image, following rule 5 in docs/ARCHITECTURE.md and docs/THEMES.md.

- src/themes/types.ts: ThemePack, Skin, AgentStatus from docs/THEMES.md.
- src/themes/tuberian.ts: the Tuberian pack. Colors from the image: grass-green background, warm wood and terracotta for homes, tan for paths, dark navy status cards, green progress bars. Emoji art per template for now. Status words from the THEMES.md table.
- src/themes/ThemeProvider.tsx: writes the pack's vars to document.documentElement as CSS variables and provides the pack through React context.
- AgentHome: uses the skin for its template (falls back to "default"). Above the home, a status card like the image: icon, name, a progress bar with "step/steps" on the right, and the "doing" line. Under the home, permission badges: one small icon per permission that isn't "off" (icons from the Permissions table in docs/system-spec.md), with a dot meaning "ask" and no dot meaning "allow". Badge icons are the same in every theme.
- The status card is positioned absolutely above the home so it does NOT change the node's measured size; the paths must still meet the round home.
- Status, step, steps and doing come in through node data; default idle, no progress.
- PathEdge: color and width from CSS variables, styled like the dirt paths in the image.
- No hex colors, fonts or sizes in components or their CSS. Everything is a CSS variable from the pack.
```

**Check:** it starts to look like the image: green ground, homes with dark status cards, tan paths. The Researcher shows a 🌐 badge. In the browser dev tools, change one `--` variable on `<html>` and watch the whole map change. Search `src/map` for `#`: no hex colors.

**Explain it:** What would you have to touch to add the Swamp theme? (Right answer: one new file in `themes/`, nothing in `map/`.)

---

## Step 7: Click an agent

```text
Add the agent panel from docs/VISION.md ("Click an agent").

- src/panel/AgentPanel.tsx slides in from the right when you click a home, closes with an X or Escape.
- Shows: name; connections (from the spec's lines: "Can start a talk with ..." and "Can be reached by ..."); all nine permissions with an off / ask / allow chip each, using the plain-English description from docs/system-spec.md; agent (its template's title in the current theme, and model or "Default model"); purpose; work history.
- Work history is a list of this agent's events from the current run, newest first. For now it says "No work yet" because runs aren't wired up.
- Clicking You shows a small panel: "This is you. Approval requests and results land here."
- Styled with the theme's CSS variables only.
```

**Check:** click the Researcher: connections say it can start a talk with the Writer and the Overseer, permissions show web as allowed and everything else off, the purpose matches `presets/hello-tubes.json`. Click the Writer: it can be reached by the Researcher but can't start a talk with it.

**Explain it:** The panel's connections aren't stored anywhere. Where do they come from?

---

## Step 8: Run it

```text
Wire up running a task. Follow the run events table in docs/ARCHITECTURE.md exactly.

- src/run/useRun.ts: hook returning { start(systemId, taskId, inputs), runStatus, agents, travelers, events }.
  - start() POSTs /runs, then opens an EventSource on /runs/{runId}/events.
  - agents: per agent { status, doing, step, steps, activePermission, lastReview }. agent.action sets activePermission for 1.5 seconds.
  - travelers: each message.sent adds { id, from, to, text, files, isReply }. Removed after its animation finishes.
  - events: all events, for work history.
  - Ignore events whose seq isn't greater than the last one. Close the EventSource on run.finished and on unmount.
- TopBar: a Run button for the system's manual task (inputs use their defaults for now), and the run status text: Idle, Running or Done.
- Map: merge run state into node data so status cards update live; the badge in activePermission glows.
- src/map/Traveler.tsx: render travelers with React Flow's ViewportPortal so they live in map coordinates. Each one is the theme's traveler emoji moving in a straight line from the `from` home's center to the `to` home's center over about 1.2 seconds (CSS transform transition is enough, since paths are straight). It carries a speech bubble with the first ~40 characters of the text, or the file emoji and file name if files isn't empty.
- On overseer.plan, briefly highlight the paths on the road. On message.blocked, flash a red dashed line between the two homes. On run.finished, show the result in a card next to the You home.
- AgentPanel work history now shows that agent's events from this run.
- Keep spec state and run state separate. Nothing about a run is written into the spec.
```

**Check:** press Run. The overseer's card says it's reading the task, the road lights up, a critter walks to the Researcher with a bubble, the Researcher's bar fills step by step while its 🌐 badge glows, a critter carries a file down the one-way path to the Writer, replies walk back, and the result appears next to You. Click the Researcher afterwards: its work history lists everything it did. Press Run again: everything resets and plays again.

**Explain it:** Walk through one `message.sent` event, from the line of Python that emits it to the critter moving on screen.

**M0 is done.** Commit, then:

```powershell
git tag m0
git push --tags
```

Tick the M0 boxes in `docs/ROADMAP.md` and record a short screen capture. That's your first portfolio clip.

---

## Step 9 (stretch): any preset, any theme

```text
- Add GET /systems on the backend listing every preset: id, name, description.
- Add a preset picker to the TopBar; switching it loads that system onto the map.
- Add src/themes/swamp.ts from docs/THEMES.md and a theme switcher in Settings. Remember the choice in localStorage, wrapped in try/catch.
```

**Check:** switch to Inbox Helper and run Watch inbox on the fake engine: six homes counting yours, and the Reply Drafter shows a "send email" badge with an "ask" dot. Switch to Swamp: frogs, lily pads, reeds. Nothing in `src/map` changed.

---

## After M0

Next is M1 in `docs/ROADMAP.md`: swap FakeRunner for a real ClaudeRunner. See "Claude setup" in the README first.
