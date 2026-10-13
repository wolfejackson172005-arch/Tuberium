// Placeholder run state for the Worlds screen, keyed by preset id. Names, agents and triggers
// come from the real presets; this file only fills in what the backend doesn't track yet
// (run history, today's cost, approvals, and which theme each world uses).

export type WorldStatus = "running" | "done" | "paused" | "idle" | "draft";

export interface MockRunState {
  themeId: string;
  themeName: string;
  extraTags?: string[];
  status: WorldStatus;
  detail: string;
  progress: number;
  approval?: string;
  costTodayUsd: number;
  active: boolean;
}

export const mockRunStates: Record<string, MockRunState> = {
  "inbox-helper": {
    themeId: "swamp",
    themeName: "Swamp",
    status: "running",
    detail: "Sorter is labelling 12 emails",
    progress: 0.6,
    approval: "2 replies",
    costTodayUsd: 0.14,
    active: true,
  },
  investments: {
    themeId: "business",
    themeName: "Business",
    extraTags: ["Paper trading"],
    status: "done",
    detail: "Morning brief is ready",
    progress: 1,
    approval: "1 trade",
    costTodayUsd: 0.31,
    active: true,
  },
  "resume-helper": {
    themeId: "tuberian",
    themeName: "Tuberian",
    status: "running",
    detail: "Step 2 of 4: tailoring your experience",
    progress: 0.5,
    costTodayUsd: 0.09,
    active: true,
  },
  "social-autopilot": {
    themeId: "jungle",
    themeName: "Jungle",
    status: "paused",
    detail: "Waiting for you to resume",
    progress: 0.3,
    costTodayUsd: 0.06,
    active: false,
  },
  "data-cleanup": {
    themeId: "factory",
    themeName: "Factory",
    status: "idle",
    detail: "Last run finished 2 days ago",
    progress: 0,
    costTodayUsd: 0,
    active: false,
  },
  "game-design": {
    themeId: "tuberian",
    themeName: "Tuberian",
    status: "draft",
    detail: "Add one more agent to begin",
    progress: 0.2,
    costTodayUsd: 0,
    active: false,
  },
};

export const mockSpend = { todayUsd: 0.82, limitUsd: 5 };

export const mockUser = { name: "Alex Tuber", workspace: "Cozy workspace", initials: "AT" };
