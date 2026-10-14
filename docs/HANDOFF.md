# Handoff: where Tuberium is (Oct 13, 2026)

Read this first when you pick the project back up. The team plan is in [plans/m0-team-plan.md](plans/m0-team-plan.md).

## Where we are

**M0 is done.** Any preset runs on fake agents (no AI, no API key) and plays out live on the map: the overseer plans, the road lights up, critters carry messages and files along the lines, progress bars fill, badges glow, and the result lands next to You. The Swamp theme and the preset picker work too.

- `main` and the tag `m0` hold the finished M0. The `m0` branch is merged.
- **Next step: M1 (real agents)** in [ROADMAP.md](ROADMAP.md). Start with "Claude setup" in the README.

## Still to do (people stuff, not code)

1. **GitHub:** add your two teammates (repo Settings, then Collaborators). Turn on a rule requiring one approving review on pull requests.
2. **Pick tracks for M1:** backend (Python), map (React) or look and panel (React and CSS). See the plan.
3. **Learn what got built.** The AI built all of M0 in one go, so nobody has written it yet. Each person should take one track, read its code, and answer that step's "Explain it" question in [M0-prompts.md](M0-prompts.md).
4. **Branch name for M1:** use `milestone/m1`, not `m1`. A branch and a tag with the same name confuse git: `git push --tags` failed this time and the tag had to be pushed by its full name.

## Decisions made along the way

- **Lines are a web, not roads.** One straight segment per spec line, house to house, never merged into shared roads. This is now in VISION, ARCHITECTURE, THEMES and the Cursor rules.
- **Team of 3, working on a milestone branch** with pull requests reviewed by one other person.
- **The You home** sits next to the overseer in the first direction that's clear of homes and lines (`frontend/src/map/layout.ts`), not always 160px to the left. Otherwise it lands on top of a line in Inbox Helper.
- **Hello Tubes layout:** the Researcher and Writer moved to `x: 320` so the one-way Researcher-to-Writer line isn't hidden under the Overseer.
- **Theme packs got a `traveler` field** (the character that walks the lines). It was added to the type in THEMES.md.
- **TypeScript strict mode** turned on in `frontend/tsconfig.app.json`; the Vite template didn't set it.
- **FakeRunner:** an agent only hands a file to a later agent when the overseer messaged it, so hand-offs never chain too deep.
- **Run button** starts the first on-demand task, or else the first task. That's how Inbox Helper's "Watch inbox" runs on the fake engine.
- **`TUBERIUM_RUNNER=claude`** makes `POST /runs` return 501 until M1 builds the Claude runner.

## Feedback to build later (Oct 14)

Not started. Each note says which roadmap milestone it fits.

- **Controls inside a world (on the map):**
  - a back button to Worlds (today only the `tuberium` name links back);
  - a menu;
  - pause / reactivate for the world (M2: pause, play and stop);
  - add and remove agents, and add and remove lines (M3: Builder). The note said "roads", but these are lines in the spec, and they stay a web: one line per pair of houses that can talk.
- **Notifications don't work.** The bell on the Worlds screen, its count, and the approval banners are placeholders. They need real approval requests from M2 to show anything.
- **Make it look like a 2D video game with animations, not emoji art.** Real sprites for homes, critters and travelers; animated walking, idle and working states; a living map (swaying trees, smoke from chimneys). This is the M5 "Real art for Tuberian" item, pulled forward as a priority. Art goes in the theme pack (`art` can become an image path), so components don't change.

## Running it (Windows)

On this PC, `py` and `python` aren't on PATH, so the Python environment was made with `uv` at the repo root (`.venv`).

Backend:

```powershell
cd backend
..\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 (use `localhost`, not `127.0.0.1`, so CORS allows it). Press **Run: Fun fact**.

Quick checks: `python spec/validate.py` (9 files report `ok`), `backend\scripts\try_run.py` (prints a whole fake run), and `npx tsc -b` in `frontend/`.
