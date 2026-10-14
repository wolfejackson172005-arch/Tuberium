import { useCallback, useEffect, useReducer, useRef } from "react";
import { runEventsUrl, startRun } from "../api";
import type { PermissionName } from "../spec/types";
import type { AgentStatus } from "../themes/types";
import type { RunEvent, Verdict } from "./events";

// Run state: what's happening now. Never saved with the spec.

export interface AgentRunState {
  status: AgentStatus;
  doing?: string;
  step?: number;
  steps?: number;
  activePermission?: PermissionName;
  lastReview?: { verdict: Verdict; note: string };
  costUsd?: number;
}

export interface Traveler {
  id: string;
  from: string;
  to: string;
  text: string;
  files: string[];
  isReply: boolean;
}

export interface BlockedFlash {
  id: string;
  from: string;
  to: string;
}

export type RunStatus = "idle" | "running" | "done" | "failed";

interface RunState {
  runStatus: RunStatus;
  agents: Record<string, AgentRunState>;
  travelers: Traveler[];
  events: RunEvent[];
  lastSeq: number;
  road: string[];
  roadLit: boolean;
  blocked: BlockedFlash[];
  result?: string;
  costUsd?: number;
  error?: string;
}

type Action =
  | { type: "reset" }
  | { type: "event"; event: RunEvent }
  | { type: "failed"; error: string }
  | { type: "travelerDone"; id: string }
  | { type: "clearPermission"; agentId: string; permission: PermissionName }
  | { type: "dimRoad" }
  | { type: "clearBlocked"; id: string };

const initialState: RunState = {
  runStatus: "idle",
  agents: {},
  travelers: [],
  events: [],
  lastSeq: 0,
  road: [],
  roadLit: false,
  blocked: [],
};

const ACTION_GLOW_MS = 1500;
const ROAD_LIT_MS = 2500;
const BLOCKED_FLASH_MS = 1500;

function updateAgent(state: RunState, agentId: string, patch: Partial<AgentRunState>): RunState {
  const previous = state.agents[agentId] ?? { status: "idle" };
  return { ...state, agents: { ...state.agents, [agentId]: { ...previous, ...patch } } };
}

function applyEvent(state: RunState, event: RunEvent): RunState {
  const next: RunState = { ...state, lastSeq: event.seq, events: [...state.events, event] };
  switch (event.type) {
    case "run.started":
      return { ...next, runStatus: "running", agents: {} };
    case "overseer.plan":
      return { ...next, road: event.data.steps.map((s) => s.agentId), roadLit: true };
    case "agent.status": {
      const { agentId, status, doing, step, steps, costUsd } = event.data;
      const previous = next.agents[agentId];
      return updateAgent(next, agentId, {
        status,
        doing,
        step: step ?? previous?.step,
        steps: steps ?? previous?.steps,
        costUsd: costUsd ?? previous?.costUsd,
      });
    }
    case "agent.action":
      return updateAgent(next, event.data.agentId, {
        activePermission: event.data.permission,
        doing: event.data.label,
      });
    case "message.sent": {
      const { from, to, text, files, isReply } = event.data;
      return {
        ...next,
        travelers: [...next.travelers, { id: String(event.seq), from, to, text, files, isReply }],
      };
    }
    case "message.blocked":
      return {
        ...next,
        blocked: [...next.blocked, { id: String(event.seq), from: event.data.from, to: event.data.to }],
      };
    case "overseer.review":
      return updateAgent(next, event.data.agentId, {
        lastReview: { verdict: event.data.verdict, note: event.data.note },
      });
    case "run.finished":
      return {
        ...next,
        runStatus: event.data.status === "done" ? "done" : "failed",
        result: event.data.result,
        costUsd: event.data.costUsd,
        travelers: [],
      };
    default:
      return next;
  }
}

// A reducer is a pure function (state, action) => new state. useReducer keeps related updates in one place.
function reducer(state: RunState, action: Action): RunState {
  switch (action.type) {
    case "reset":
      return initialState;
    case "event":
      return action.event.seq > state.lastSeq ? applyEvent(state, action.event) : state;
    case "failed":
      return { ...state, runStatus: "failed", error: action.error };
    case "travelerDone":
      return { ...state, travelers: state.travelers.filter((t) => t.id !== action.id) };
    case "clearPermission": {
      const agent = state.agents[action.agentId];
      if (agent?.activePermission !== action.permission) return state;
      return updateAgent(state, action.agentId, { activePermission: undefined });
    }
    case "dimRoad":
      return { ...state, roadLit: false };
    case "clearBlocked":
      return { ...state, blocked: state.blocked.filter((b) => b.id !== action.id) };
  }
}

export function useRun() {
  const [state, dispatch] = useReducer(reducer, initialState);
  // useRef holds values that survive re-renders without causing one: the open stream and pending timers.
  const sourceRef = useRef<EventSource | null>(null);
  const timersRef = useRef(new Set<number>());

  const later = useCallback((ms: number, action: Action) => {
    const id = window.setTimeout(() => {
      timersRef.current.delete(id);
      dispatch(action);
    }, ms);
    timersRef.current.add(id);
  }, []);

  const stop = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      stop();
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
    };
  }, [stop]);

  const start = useCallback(
    async (systemId: string, taskId: string, inputs: Record<string, string>) => {
      stop();
      dispatch({ type: "reset" });
      let runId: string;
      try {
        runId = await startRun(systemId, taskId, inputs);
      } catch {
        dispatch({ type: "failed", error: "Couldn't start the run. Is the backend running?" });
        return;
      }

      // EventSource is the browser's built-in SSE client: one long request the server keeps pushing events down.
      const source = new EventSource(runEventsUrl(runId));
      sourceRef.current = source;
      let lastSeq = 0;

      source.onmessage = (message: MessageEvent<string>) => {
        const event = JSON.parse(message.data) as RunEvent;
        if (event.seq <= lastSeq) return;
        lastSeq = event.seq;
        dispatch({ type: "event", event });

        if (event.type === "agent.action") {
          later(ACTION_GLOW_MS, {
            type: "clearPermission",
            agentId: event.data.agentId,
            permission: event.data.permission,
          });
        } else if (event.type === "overseer.plan") {
          later(ROAD_LIT_MS, { type: "dimRoad" });
        } else if (event.type === "message.blocked") {
          later(BLOCKED_FLASH_MS, { type: "clearBlocked", id: String(event.seq) });
        } else if (event.type === "run.finished") {
          source.close();
        }
      };

      source.onerror = () => {
        // While open, EventSource reconnects by itself and the backend replays; seq de-duplicates.
        if (source.readyState === EventSource.CLOSED && sourceRef.current === source) {
          dispatch({ type: "failed", error: "Lost the connection to the backend." });
        }
      };
    },
    [later, stop],
  );

  const removeTraveler = useCallback((id: string) => dispatch({ type: "travelerDone", id }), []);

  const clear = useCallback(() => {
    stop();
    dispatch({ type: "reset" });
  }, [stop]);

  return {
    start,
    clear,
    removeTraveler,
    runStatus: state.runStatus,
    agents: state.agents,
    travelers: state.travelers,
    events: state.events,
    road: state.road,
    roadLit: state.roadLit,
    blocked: state.blocked,
    result: state.result,
    costUsd: state.costUsd,
    error: state.error,
  };
}

export type RunView = ReturnType<typeof useRun>;
