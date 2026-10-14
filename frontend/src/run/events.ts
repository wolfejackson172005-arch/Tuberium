// The run events table from docs/ARCHITECTURE.md. Keep in step with backend/app/engine/events.py.
import type { PermissionName } from "../spec/types";
import type { AgentStatus } from "../themes/types";

export type Verdict = "accepted" | "sent-back";

// A discriminated union again: checking `event.type` narrows `event.data` to the right shape.
export type RunEventBody =
  | { type: "run.started"; data: { taskId: string } }
  | { type: "overseer.plan"; data: { steps: { agentId: string; job: string }[] } }
  | {
      type: "agent.status";
      // costUsd: that agent's cumulative cost this run, when the runner knows it.
      data: {
        agentId: string;
        status: AgentStatus;
        doing?: string;
        step?: number;
        steps?: number;
        costUsd?: number;
      };
    }
  | { type: "agent.action"; data: { agentId: string; permission: PermissionName; label: string } }
  | {
      type: "message.sent";
      data: { lineId: string; from: string; to: string; text: string; files: string[]; isReply: boolean };
    }
  | { type: "message.blocked"; data: { from: string; to: string; reason: string } }
  | {
      type: "approval.requested";
      data: { approvalId: string; agentId: string; permission: PermissionName; detail: string };
    }
  | { type: "approval.resolved"; data: { approvalId: string; approved: boolean } }
  | { type: "overseer.review"; data: { agentId: string; verdict: Verdict; note: string } }
  | { type: "overseer.suggestion"; data: { suggestionId: string; change: string; reason: string } }
  | { type: "run.paused"; data: Record<string, never> }
  | { type: "run.resumed"; data: Record<string, never> }
  | { type: "run.finished"; data: { status: string; result: string; costUsd: number } };

export type RunEvent = { runId: string; seq: number; ts: string } & RunEventBody;

// Which agents an event is about, for work history.
export function agentsInEvent(event: RunEvent): string[] {
  switch (event.type) {
    case "agent.status":
    case "agent.action":
    case "approval.requested":
    case "overseer.review":
      return [event.data.agentId];
    case "message.sent":
    case "message.blocked":
      return [event.data.from, event.data.to];
    case "overseer.plan":
      return event.data.steps.map((s) => s.agentId);
    default:
      return [];
  }
}

export function describeEvent(event: RunEvent, nameOf: (id: string) => string): string {
  switch (event.type) {
    case "run.started":
      return `Run started (${event.data.taskId})`;
    case "overseer.plan":
      return `Planned the road: ${event.data.steps.map((s) => nameOf(s.agentId)).join(", then ")}`;
    case "agent.status": {
      const { status, doing, step, steps } = event.data;
      const progress = step !== undefined && steps !== undefined ? ` (${step}/${steps})` : "";
      return `${nameOf(event.data.agentId)}: ${doing ?? status}${progress}`;
    }
    case "agent.action":
      return `${nameOf(event.data.agentId)} used ${event.data.permission}: ${event.data.label}`;
    case "message.sent": {
      const { from, to, text, files } = event.data;
      const carrying = files.length > 0 ? ` with ${files.join(", ")}` : "";
      return `${nameOf(from)} → ${nameOf(to)}${carrying}: "${text}"`;
    }
    case "message.blocked":
      return `Blocked ${nameOf(event.data.from)} → ${nameOf(event.data.to)}: ${event.data.reason}`;
    case "approval.requested":
      return `${nameOf(event.data.agentId)} asked to use ${event.data.permission}: ${event.data.detail}`;
    case "approval.resolved":
      return event.data.approved ? "Approved" : "Denied";
    case "overseer.review":
      return `Review of ${nameOf(event.data.agentId)}: ${event.data.verdict}. ${event.data.note}`;
    case "overseer.suggestion":
      return `Suggestion: ${event.data.change}`;
    case "run.paused":
      return "Run paused";
    case "run.resumed":
      return "Run resumed";
    case "run.finished":
      return `Run finished (${event.data.status})`;
  }
}
