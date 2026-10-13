# Tuberium vision

The source of truth for what Tuberium is. When the idea changes, change this file first, then the other docs, then the code.

## In one line

A game-like, themed map of an AI agent team. Agents live in houses, lines show who can talk, an overseer manages everything, and you watch them travel, work and ask permission live.

## Goal

Gamify, simplify and visualize agentic AI tasks and pipelines, so people can see and control exactly what each agent is doing. It should help people learn how agentic AI systems work, and be easy and fun enough to appeal to everyone, from someone automating their first email to someone running serious data work.

## What you see

![Tuberian reference art](img/tuberian-reference.png)

The default look (Tuberian): a village where every agent has a house, paths connect who can talk, and critters walk the paths carrying messages and files.

- **Agents are homes.** Each agent has a home on the map: a circle, a house, a hut, a lily pad, a machine, depending on the theme.
- **Lines are who can talk to who.** A line between two agents means they can talk and hand each other files. No line, no talking. Lines are styled by the theme (tubes, vines, conveyor belts, reeds).
- **Agents travel.** When one agent talks to another or hands over a file, its character visibly leaves home, travels along the line carrying a speech bubble or a file, and comes back.
- **Who's doing what, always visible.** Above every home, a status card: the agent's icon and name, a progress bar with a step count ("2/4"), and one line on what it's doing right now ("Sorting 12 new emails").
- **You control the run.** A top bar shows the time and whether things are running, with pause, play and fast-forward. A sidebar holds Home (the map), Agents, Tasks, Logs and Settings.
- **Permissions are visible.** Every home shows badges for what the agent is allowed to do. A badge lights up while the agent is using it, so you can see the moment an agent reads your email or writes a file.
- **You are on the map.** A "You" circle sits next to the overseer. When an agent needs permission, the request shows up there.

## Click an agent

A panel opens with:

- Name
- Connections: who it can talk to
- Permissions: what it can do (off / ask me first / allowed)
- Agent: which agent type it is and which AI model it uses
- Purpose: a short paragraph on what it's for
- Work history: everything it has done, run by run

## The overseer

Every system has exactly one. It:

- reads each task and plans the road: who does what, in what order
- hands out the work along the lines and manages the agents
- reviews every result and sends work back if it isn't good enough
- evaluates progress and keeps the progress bars honest
- suggests changes to the system (a new line, a tighter permission, a clearer purpose)

Suggestions always come to you. The overseer never changes the system on its own.

## Tasks

A system can have several tasks, each with its own trigger:

- **On demand:** runs when you press the button
- **Scheduled:** runs at set times (every weekday at 8am)
- **Always on:** keeps watching (new email, new file) and wakes the agents when something shows up

## Presets

Ready-made systems you can run as-is or change:

- Resume application helper
- Investments (research, briefing and trading)
- Reading emails (inbox helper)
- Data cleaning
- Essays
- Game design
- Social media automation

Plus **Custom**: start with just the overseer and you, and build your own system.

## Themes

Themes change the look, never what the system does.

- **Tuberian** (default): cozy village, silly but not too silly, the middle ground (see the image above)
- **Business Professional:** clean and serious, for high-level work
- **Factory:** business meets industry, machines and conveyor belts
- **Jungle:** silly animals, for people just getting started
- **Swamp:** frogs, also silly

## Platform

Starts as a web app built in Cursor, in a GitHub repo. Could become a desktop app or a hosted website later.

## Long term

A portfolio project first. Maybe a product later.
