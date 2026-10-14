import type { MockRunState, WorldStatus } from "../mock/worlds";
import type { System, Trigger } from "../spec/types";
import { defaultTheme } from "../themes";

// What a World card shows: the real spec plus (for now) mock run state.
export interface World {
  id: string;
  name: string;
  themeId: string;
  themeName: string;
  tags: string[];
  status: WorldStatus;
  detail: string;
  progress: number;
  approval?: string;
  agents: string[];
  costTodayUsd: number;
  active: boolean;
}

const TRIGGER_TAGS: Record<Trigger["type"], string> = {
  manual: "On demand",
  schedule: "Scheduled",
  always: "Always on",
};

export function toWorld(system: System, state: MockRunState | undefined): World {
  const triggerTags = system.tasks.map((t) => TRIGGER_TAGS[t.trigger.type]);
  return {
    id: system.id,
    name: system.name,
    themeId: state?.themeId ?? defaultTheme.id,
    themeName: state?.themeName ?? defaultTheme.name,
    tags: [...new Set([...triggerTags, ...(state?.extraTags ?? [])])],
    status: state?.status ?? "idle",
    detail: state?.detail ?? (system.tasks.length > 0 ? "Ready to run" : "No tasks yet"),
    progress: state?.progress ?? 0,
    approval: state?.approval,
    agents: system.agents.map((a) => a.name),
    costTodayUsd: state?.costTodayUsd ?? 0,
    active: state?.active ?? false,
  };
}
