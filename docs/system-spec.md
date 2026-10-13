# System spec v0.2

The JSON format for a Tuberium system. Machine-readable version: `spec/system.schema.json`. Working examples: everything in `presets/`.

## Top level

```json
{
  "specVersion": "0.2",
  "id": "inbox-helper",
  "name": "Inbox Helper",
  "description": "optional",
  "preset": "inbox-helper",
  "agents": [],
  "lines": [],
  "tasks": []
}
```

`preset` records which preset a system was copied from. Custom systems leave it out.

## Agents

Every agent is a home on the map.

```json
{
  "id": "drafter",
  "name": "Reply Drafter",
  "kind": "agent",
  "template": "writer",
  "purpose": "Drafts replies for anything marked Needs reply. Nothing goes out until you approve it.",
  "permissions": { "readEmail": "allow", "sendEmail": "ask" },
  "limits": { "maxTurns": 8, "maxCostUsd": 0.1 },
  "position": { "x": 0, "y": 280 }
}
```

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Lowercase, digits, dashes. `you` is reserved for the human circle. |
| `name` | yes | Shown on the map and in the panel. |
| `kind` | yes | `overseer` or `agent`. Exactly one overseer per system. |
| `template` | no | Which library agent it came from (see `docs/PRESETS.md`). Themes use it to pick the home and character. |
| `purpose` | yes | Short paragraph, max 600 characters. Shown in the panel and given to the agent as its role. |
| `model` | no | Leave out to use the app default. |
| `permissions` | yes | See below. `{}` means it can only talk. |
| `limits` | no | Hard caps: `maxTurns`, `maxCostUsd`, and `maxTradeUsd` for agents with `trade`. The engine stops the agent when one is hit. |
| `position` | yes | Where the home sits on the map. Layout, not theme. |

### Permissions

Each permission is `off`, `ask` or `allow`. Anything left out is `off`.

| Key | Badge | What it lets the agent do |
|---|---|---|
| `web` | 🌐 | Search and read web pages |
| `readFiles` | 📄 | Read files in this system's workspace folder |
| `writeFiles` | ✏️ | Create and edit files in this system's workspace folder |
| `runCode` | 💻 | Run code, e.g. Python for data cleaning |
| `readEmail` | 📥 | Read your inbox |
| `sendEmail` | 📤 | Send email as you |
| `postSocial` | 📣 | Publish posts to your social accounts |
| `submitForms` | 📝 | Fill in and submit online forms as you, e.g. job applications |
| `trade` | 💸 | Buy, sell and move money in your connected brokerage account, within the trade caps |

Badges look the same in every theme.

`ask` means the agent pauses and the request shows up on the You circle every time.

`trade` is the only permission that touches money. On top of its level, it's held to the agent's `limits.maxTradeUsd` (largest single trade), a daily trade cap in `backend/.env`, and paper mode (fake money) until you switch to live. See [SAFETY.md](SAFETY.md).

Talking to other agents is not a permission. It is controlled by lines.

## Lines

```json
{ "id": "l1", "from": "reader", "to": "sorter", "twoWay": false }
```

- A line means the two agents can talk and hand each other files.
- No line, no talking. The engine blocks it, and the map shows the blocked attempt.
- `twoWay` defaults to `true`. With `false`, only `from` can start a conversation; `to` can still answer.
- The overseer must be able to reach every agent by following lines (directly or through others).
- The You circle is not in the spec. The app always draws it next to the overseer and connects the two.

## Tasks

A task is a job for the system. It always goes to the overseer first.

```json
{
  "id": "watch-inbox",
  "name": "Watch inbox",
  "goal": "Summarize and sort every new email. Draft replies for anything that needs one.",
  "inputs": [],
  "trigger": { "type": "always", "watch": "newEmail", "checkEveryMinutes": 5 },
  "maxCostUsd": 0.25
}
```

| Field | Notes |
|---|---|
| `goal` | What done looks like. Use `{{key}}` to drop in an input. |
| `inputs` | Fields you fill in before an on-demand run. Scheduled and always-on tasks use the defaults. `kind` is `text`, `longtext` or `file`. |
| `maxCostUsd` | Spending cap for one run, across every agent. Strongly recommended for always-on tasks. |

### Triggers

| Type | Fields | Meaning |
|---|---|---|
| `manual` | none | On demand: runs when you press the button. |
| `schedule` | `cron`, `timezone` | Runs at set times. `"0 8 * * 1-5"` = weekdays at 8:00. |
| `always` | `watch`, `checkEveryMinutes` | A cheap check with no AI runs every few minutes. Agents only wake when it finds something. `watch` is `newEmail`, `newFile` or `webChange`. |

Why always-on works this way: an AI agent looping nonstop would burn money. A plain code check ("any new email?") is free, so the agents sleep until there is real work.

## What does not belong in the spec

- Theme, colors, houses, animals. Those live in theme packs.
- Run results, work history, cost. Those live in run records.
- API keys or any secret.

## Changing the spec

1. Edit `spec/system.schema.json`.
2. Update this file and the presets.
3. Run `python spec/validate.py`.
4. Update `backend/app/models.py` and `frontend/src/spec/types.ts` to match.
