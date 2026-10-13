// TypeScript mirror of spec/system.schema.json. Keep the two in step.

export type Level = "off" | "ask" | "allow";

export type PermissionName =
  | "web"
  | "readFiles"
  | "writeFiles"
  | "runCode"
  | "readEmail"
  | "sendEmail"
  | "postSocial"
  | "submitForms"
  | "trade";

// Anything left out is "off".
export type Permissions = Partial<Record<PermissionName, Level>>;

export interface Position {
  x: number;
  y: number;
}

export interface Limits {
  maxTurns?: number;
  maxCostUsd?: number;
  maxTradeUsd?: number;
}

export interface Agent {
  id: string;
  name: string;
  kind: "overseer" | "agent";
  template?: string;
  purpose: string;
  model?: string;
  permissions: Permissions;
  limits?: Limits;
  position: Position;
}

export interface Line {
  id: string;
  from: string;
  to: string;
  // Defaults to true. false: only `from` can start a conversation; `to` can still answer.
  twoWay?: boolean;
}

export interface InputField {
  key: string;
  label: string;
  kind: "text" | "longtext" | "file";
  default?: string;
}

// A discriminated union: the `type` field tells TypeScript which other fields exist.
export type Trigger =
  | { type: "manual" }
  | { type: "schedule"; cron: string; timezone: string }
  | { type: "always"; watch: "newEmail" | "newFile" | "webChange"; checkEveryMinutes: number };

export interface Task {
  id: string;
  name: string;
  goal: string;
  inputs?: InputField[];
  trigger: Trigger;
  maxCostUsd?: number;
}

export interface System {
  specVersion: "0.2";
  id: string;
  name: string;
  description?: string;
  preset?: string;
  agents: Agent[];
  lines: Line[];
  tasks: Task[];
}

export interface SystemSummary {
  id: string;
  name: string;
  description?: string;
}
