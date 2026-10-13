import type { Agent, Line, System } from "./types";

// True if a line lets `from` START a conversation with `to`. Mirrors the engine's line guard.
export function canStart(system: System, from: string, to: string): boolean {
  return system.lines.some(
    (line) =>
      (line.from === from && line.to === to) ||
      (line.twoWay !== false && line.from === to && line.to === from),
  );
}

export function startsTalkWith(system: System, agentId: string): Agent[] {
  return system.agents.filter((a) => a.id !== agentId && canStart(system, agentId, a.id));
}

export function reachedBy(system: System, agentId: string): Agent[] {
  return system.agents.filter((a) => a.id !== agentId && canStart(system, a.id, agentId));
}

export function lineBetween(system: System, a: string, b: string): Line | undefined {
  return system.lines.find(
    (line) => (line.from === a && line.to === b) || (line.from === b && line.to === a),
  );
}

export function overseerOf(system: System): Agent | undefined {
  return system.agents.find((a) => a.kind === "overseer");
}

// The task the Run button starts: the first on-demand task, or else the first task.
export function runnableTask(system: System) {
  return system.tasks.find((t) => t.trigger.type === "manual") ?? system.tasks[0];
}
