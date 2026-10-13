import { useEffect } from "react";
import { agentsInEvent, describeEvent, type RunEvent } from "../run/events";
import { reachedBy, startsTalkWith } from "../spec/graph";
import { PERMISSIONS } from "../spec/permissions";
import type { Agent, Level, System } from "../spec/types";
import { useTheme } from "../themes/useTheme";
import { skinFor } from "../themes/types";
import "./panel.css";

const LEVEL_TEXT: Record<Level, string> = { off: "off", ask: "ask me first", allow: "allowed" };

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
}

function names(agents: Agent[]): string {
  return agents.length > 0 ? agents.map((a) => a.name).join(", ") : "nobody";
}

interface Props {
  system: System;
  agentId: string;
  events: RunEvent[];
  onClose: () => void;
}

export function AgentPanel({ system, agentId, events, onClose }: Props) {
  const theme = useTheme();
  useEscape(onClose);

  const agent = system.agents.find((a) => a.id === agentId);
  if (!agent) return null;

  const skin = skinFor(theme, agent.kind === "overseer" ? "overseer" : agent.template);
  const nameOf = (id: string) => (id === "you" ? "You" : (system.agents.find((a) => a.id === id)?.name ?? id));
  // Connections aren't stored anywhere: they are worked out from the spec's lines.
  const startsWith = startsTalkWith(system, agent.id);
  const reached = reachedBy(system, agent.id);
  const history = events.filter((e) => agentsInEvent(e).includes(agent.id)).reverse();

  return (
    <aside className="side-panel">
      <div className="side-panel__header">
        <h2>
          <span className="side-panel__art">{skin.art}</span>
          {agent.name}
        </h2>
        <button type="button" className="side-panel__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <section className="side-panel__section">
        <h3>Connections</h3>
        <p>Can start a talk with: {names(startsWith)}</p>
        <p>Can be reached by: {names(reached)}</p>
      </section>

      <section className="side-panel__section">
        <h3>Permissions</h3>
        <ul className="permission-list">
          {PERMISSIONS.map((p) => {
            const level = agent.permissions[p.name] ?? "off";
            return (
              <li key={p.name} className="permission-list__item">
                <span className="permission-list__badge">{p.badge}</span>
                <span className="permission-list__text">{p.description}</span>
                <span className={`chip chip--${level}`}>{LEVEL_TEXT[level]}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="side-panel__section">
        <h3>Agent</h3>
        <p>{skin.title}</p>
        <p className="side-panel__muted">{agent.model ?? "Default model"}</p>
      </section>

      <section className="side-panel__section">
        <h3>Purpose</h3>
        <p>{agent.purpose}</p>
      </section>

      <section className="side-panel__section">
        <h3>Work history</h3>
        {history.length === 0 ? (
          <p className="side-panel__muted">No work yet</p>
        ) : (
          <ol className="history">
            {history.map((e) => (
              <li key={e.seq} className="history__item">
                <span className="history__time">{new Date(e.ts).toLocaleTimeString()}</span>
                {describeEvent(e, nameOf)}
              </li>
            ))}
          </ol>
        )}
      </section>
    </aside>
  );
}

export function YouPanel({ result, onClose }: { result?: string; onClose: () => void }) {
  useEscape(onClose);
  return (
    <aside className="side-panel">
      <div className="side-panel__header">
        <h2>You</h2>
        <button type="button" className="side-panel__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      <section className="side-panel__section">
        <p>This is you. Approval requests and results land here.</p>
        {result && <p className="side-panel__muted">Last result: {result}</p>}
      </section>
    </aside>
  );
}
