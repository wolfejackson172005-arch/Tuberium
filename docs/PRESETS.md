# Presets and the agent library

Every preset is a full system file in `presets/`. Pick one, run it as-is, or change it. Every preset starts with the overseer connected to every agent; the extra lines below are the shortcuts agents use to hand work to each other directly.

`→` is a one-way line (only the left side starts the conversation). `↔` is two-way.

## The presets

| Preset | File | Runs | Agents | Extra lines | Asks you before |
|---|---|---|---|---|---|
| Resume Application Helper | `resume-helper.json` | On demand | Job Scout, Posting Analyst, Resume Tailor, Fact Checker, Applier | Scout → Analyst, Analyst → Tailor, Tailor ↔ Checker, Checker → Applier | Submitting each application |
| Investment Desk | `investments.json` | Weekdays 8:00 | Market Researcher, Portfolio Analyst, Risk Checker, Brief Writer, Trader | Researcher → Analyst, Analyst ↔ Risk, Risk → Trader | Every trade (paper mode until you go live) |
| Inbox Helper (reading emails) | `inbox-helper.json` | Always on, checks every 5 min; digest at 17:00 | Mail Reader, Sorter, Reply Drafter, Digest Writer | Reader → Sorter, Sorter → Drafter | Sending any email |
| Data Cleanup | `data-cleanup.json` | On demand | Profiler, Cleaner, Validator, Reporter | Profiler → Cleaner, Cleaner ↔ Validator | Nothing: it never overwrites your original |
| Essay Workshop | `essay-workshop.json` | On demand | Researcher, Outliner, Drafter, Critic | Researcher → Outliner, Outliner → Drafter, Drafter ↔ Critic | Nothing |
| Game Design Studio | `game-design.json` | On demand | Concept Designer, Mechanics Designer, Level Designer, Lore Writer, Playtest Critic | Concept ↔ Mechanics, Concept ↔ Lore, Mechanics ↔ Levels | Nothing |
| Social Media Autopilot | `social-autopilot.json` | Mon, Wed, Fri 10:00 | Trend Scout, Content Writer, Visual Planner, Brand Checker, Publisher | Scout → Writer, Writer ↔ Visual, Writer ↔ Brand | Publishing any post |
| Custom | `custom.json` | You decide | Just the overseer | None | You decide |
| Hello Tubes (practice) | `hello-tubes.json` | On demand | Researcher, Writer | Researcher → Writer | Nothing |

Hello Tubes is the small system for building M0 and M1. It's not shown in the preset gallery.

### Design choices worth keeping

- **Resume helper submits after the Fact Checker clears it.** The road runs Tailor → Fact Checker → Applier, so nothing made-up goes out. It asks before each submit by default; switch `submitForms` to `allow` when you trust it. Some job sites ban automated applications, so check a site's terms before pointing it there.
- **Investment Desk trades behind extra locks.** Paper mode (fake money) until you flip it in `.env`, a $500 cap per trade on the Trader, a daily cap, and `ask` on every trade by default. The Trader never reads the web; trade ideas reach it through the Risk Checker, not straight from a web page. Your trading rules live in a file you write (`trading-rules.md`). Details: [SAFETY.md](SAFETY.md).
- **Inbox Helper is the always-on showcase.** The watcher checks for new email with plain code, so the agents (and your money) only wake when there's mail.
- **Social Media Autopilot asks before every post.** Use each platform's official API; scraping or unofficial posting gets accounts banned.
- **Data Cleanup writes new files.** Your original is never touched.

## The agent library

Agents you can drop into any system, Custom included. A template sets the default purpose and permissions; you can change both after adding it.

| Template | Default purpose | Default permissions |
|---|---|---|
| `overseer` | Runs the team: plans the road, hands out work, reviews results, tracks progress, suggests changes. | none |
| `researcher` | Looks things up and brings back solid, checkable facts with links. | web: allow |
| `scout` | Finds things that match criteria (jobs, trends, listings) and shortlists the best. | web: allow |
| `writer` | Turns notes and facts into clear writing in a given tone. Never makes facts up. | none |
| `reviewer` | Checks someone else's work for mistakes and sends notes back. | none |
| `analyst` | Reads data or documents and explains what matters. | readFiles: allow |
| `reader` | Reads incoming items (email, files) and summarizes each one. | readEmail: allow |
| `sorter` | Labels and routes items into categories. | none |
| `planner` | Turns a goal or research into a structured plan or outline. | none |
| `cleaner` | Fixes messy data and saves a clean copy. | readFiles, writeFiles, runCode: allow |
| `designer` | Designs systems, layouts or visuals and writes them up. | writeFiles: allow |
| `poster` | Publishes finished content. | postSocial: ask |
| `applier` | Fills in and submits online forms (job applications) with your details. | web, readFiles: allow; submitForms: ask |
| `trader` | Places trades that fit your rules, within the trade caps. | readFiles: allow; trade: ask |

Themes give every template its own character: see [THEMES.md](THEMES.md).

## Adding a preset

1. Build it in the app (from M3 on) and export the JSON, or copy a file in `presets/`.
2. Run `python spec/validate.py`.
3. Add a row to the table above.
