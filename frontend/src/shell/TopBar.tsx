import { useEffect, useState } from "react";
import { formatUsd } from "../run/cost";
import type { RunStatus } from "../run/useRun";
import type { SystemSummary } from "../spec/types";

const STATUS_TEXT: Record<RunStatus, string> = {
  idle: "Idle",
  running: "Running",
  done: "Done",
  failed: "Failed",
};

function useClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

interface Props {
  systems: SystemSummary[];
  systemId: string;
  onSystemChange: (id: string) => void;
  taskName?: string;
  onRun: () => void;
  runStatus: RunStatus;
  costUsd?: number;
}

export function TopBar({ systems, systemId, onSystemChange, taskName, onRun, runStatus, costUsd }: Props) {
  const now = useClock();
  const running = runStatus === "running";

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <a className="topbar__name" href="#" title="Back to your worlds">
          tuberium
        </a>
        <span className="topbar__tagline">AI Agents Working Together</span>
      </div>

      <div className="topbar__controls">
        <select
          className="topbar__select"
          value={systemId}
          onChange={(e) => onSystemChange(e.target.value)}
          disabled={running}
          aria-label="System"
        >
          {systems.length === 0 && <option value={systemId}>{systemId}</option>}
          {systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button type="button" className="topbar__run" onClick={onRun} disabled={!taskName || running}>
          {taskName ? `Run: ${taskName}` : "No task to run"}
        </button>
      </div>

      <div className="topbar__status">
        <span>
          {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}{" "}
          {now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
        </span>
        <span className={`topbar__run-status topbar__run-status--${runStatus}`}>
          <span className="topbar__dot" />
          {STATUS_TEXT[runStatus]}
        </span>
        {costUsd !== undefined && (
          <span className="topbar__cost" title="Total cost of the last run">
            {formatUsd(costUsd)}
          </span>
        )}
      </div>

      <div className="topbar__playback" title="Pause and play arrive in M2">
        <button type="button" disabled aria-label="Pause">
          ⏸
        </button>
        <button type="button" disabled aria-label="Play">
          ▶
        </button>
        <button type="button" disabled aria-label="Fast-forward">
          ⏩
        </button>
      </div>
    </header>
  );
}
