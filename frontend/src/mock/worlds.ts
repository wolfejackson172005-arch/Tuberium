// Placeholder data for the Worlds screen until it talks to the backend.
// Ids, names and agents come from presets/*.json; statuses and costs are made up.

export type WorldStatus = "running" | "done" | "paused" | "idle" | "draft";

export interface MockWorld {
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

export const mockWorlds: MockWorld[] = [
  {
    id: "inbox-helper",
    name: "Inbox Helper",
    themeId: "swamp",
    themeName: "Swamp",
    tags: ["Always on", "Watch inbox"],
    status: "running",
    detail: "Sorter is labelling 12 emails",
    progress: 0.6,
    approval: "2 replies",
    agents: ["Overseer", "Mail Reader", "Sorter", "Reply Drafter", "Digest Writer"],
    costTodayUsd: 0.14,
    active: true,
  },
  {
    id: "investments",
    name: "Investment Desk",
    themeId: "business",
    themeName: "Business",
    tags: ["Weekdays 8:00", "Paper trading"],
    status: "done",
    detail: "Morning brief is ready",
    progress: 1,
    approval: "1 trade",
    agents: ["Overseer", "Market Researcher", "Portfolio Analyst", "Risk Checker", "Brief Writer", "Trader"],
    costTodayUsd: 0.31,
    active: true,
  },
  {
    id: "resume-helper",
    name: "Resume Application Helper",
    themeId: "tuberian",
    themeName: "Tuberian",
    tags: ["On demand"],
    status: "running",
    detail: "Step 2 of 4: tailoring your experience",
    progress: 0.5,
    agents: ["Overseer", "Job Scout", "Posting Analyst", "Resume Tailor", "Fact Checker", "Applier"],
    costTodayUsd: 0.09,
    active: true,
  },
  {
    id: "social-autopilot",
    name: "Social Media Autopilot",
    themeId: "jungle",
    themeName: "Jungle",
    tags: ["Daily 9:00"],
    status: "paused",
    detail: "Waiting for you to resume",
    progress: 0.3,
    agents: ["Overseer", "Trend Scout", "Content Writer", "Visual Planner", "Brand Checker", "Publisher"],
    costTodayUsd: 0.06,
    active: false,
  },
  {
    id: "data-cleanup",
    name: "Data Cleanup",
    themeId: "factory",
    themeName: "Factory",
    tags: ["On demand"],
    status: "idle",
    detail: "Last run finished 2 days ago",
    progress: 0,
    agents: ["Overseer", "Profiler", "Cleaner", "Validator", "Reporter"],
    costTodayUsd: 0,
    active: false,
  },
  {
    id: "game-design",
    name: "Game Design Studio",
    themeId: "tuberian",
    themeName: "Tuberian",
    tags: ["On demand"],
    status: "draft",
    detail: "Add one more agent to begin",
    progress: 0.2,
    agents: ["Overseer", "Concept Designer", "Mechanics Designer", "Level Designer", "Lore Writer", "Playtest Critic"],
    costTodayUsd: 0,
    active: false,
  },
];

export const mockSpend = { todayUsd: 0.82, limitUsd: 5 };

export const mockUser = { name: "Alex Tuber", workspace: "Cozy workspace", initials: "AT" };

export const mockApprovalCount = mockWorlds.filter((w) => w.approval).length;
