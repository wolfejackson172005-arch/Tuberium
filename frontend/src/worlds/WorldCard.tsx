import type { CSSProperties, ReactNode } from "react";
import { Check, ChevronRight, CircleAlert, Clock, Ellipsis, Pause, PencilLine, Play, RotateCw } from "lucide-react";
import type { MockWorld, WorldStatus } from "../mock/worlds";
import { findTheme } from "../themes";
import { WorldScene } from "./WorldScene";

// Status is never color alone: every status has a word and an icon too.
const STATUS: Record<WorldStatus, { word: string; icon: ReactNode }> = {
  running: { word: "Running", icon: <Play className="icon icon--sm" /> },
  done: { word: "Done", icon: <Check className="icon icon--sm" /> },
  paused: { word: "Paused", icon: <Pause className="icon icon--sm" /> },
  idle: { word: "Idle", icon: <Clock className="icon icon--sm" /> },
  draft: { word: "Draft", icon: <PencilLine className="icon icon--sm" /> },
};

const ACTION: Record<WorldStatus, { label: string; icon: ReactNode; kind: "primary" | "go" }> = {
  running: { label: "Pause", icon: <Pause className="icon icon--sm" />, kind: "primary" },
  done: { label: "Run again", icon: <RotateCw className="icon icon--sm" />, kind: "primary" },
  paused: { label: "Resume", icon: <Play className="icon icon--sm" />, kind: "go" },
  idle: { label: "Run", icon: <Play className="icon icon--sm" />, kind: "go" },
  draft: { label: "Build", icon: <PencilLine className="icon icon--sm" />, kind: "go" },
};

const MAX_AVATARS = 3;

// The thumbnail borrows the world's own theme colors when that theme pack exists;
// unknown themes fall back to the default pack.
function sceneVars(themeId: string): CSSProperties {
  const vars: Record<string, string> = {};
  for (const [name, value] of Object.entries(findTheme(themeId).vars)) {
    if (name.startsWith("--scene-")) vars[name] = value;
  }
  return vars as CSSProperties;
}

function money(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

export function WorldCard({ world, index }: { world: MockWorld; index: number }) {
  const status = STATUS[world.status];
  const action = ACTION[world.status];
  const percent = Math.round(world.progress * 100);
  const shown = world.agents.slice(0, MAX_AVATARS);

  return (
    <article className="world-card">
      <div className="world-card__scene" style={sceneVars(world.themeId)}>
        <WorldScene variant={index} />
        <span className="world-card__theme">{world.themeName}</span>
      </div>

      <div className="world-card__body">
        <div className="world-card__head">
          <h3 className="world-card__name">{world.name}</h3>
          <button type="button" className="icon-button icon-button--quiet" aria-label={`More options for ${world.name}`}>
            <Ellipsis className="icon" />
          </button>
        </div>

        <ul className="world-card__tags">
          <li className="tag">{world.themeName}</li>
          {world.tags.map((tag) => (
            <li key={tag} className="tag">
              {tag}
            </li>
          ))}
        </ul>

        <p className={`world-card__status world-card__status--${world.status}`}>
          {status.icon}
          <strong>{status.word}</strong>
          <span className="world-card__detail">{world.detail}</span>
        </p>

        <div
          className="world-card__progress"
          role="progressbar"
          aria-label={`${world.name} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div className="world-card__progress-fill" style={{ width: `${percent}%` }} />
        </div>

        {world.approval && (
          <button type="button" className="world-card__approval">
            <span className="world-card__approval-icon">
              <CircleAlert className="icon icon--sm" />
            </span>
            Needs your approval: {world.approval}
            <ChevronRight className="icon icon--sm world-card__approval-chevron" />
          </button>
        )}

        <div className="world-card__foot">
          <div className="world-card__meta">
            <span className="avatars" aria-hidden="true">
              {shown.map((name, i) => (
                <span key={name} className={`avatar avatar--${(i % 4) + 1}`}>
                  {name.charAt(0)}
                </span>
              ))}
            </span>
            <span>
              {world.agents.length} agents · Today {money(world.costTodayUsd)}
            </span>
          </div>
          <div className="world-card__actions">
            <button type="button" className="button button--plain">
              Open
            </button>
            <button type="button" className={`button button--${action.kind}`}>
              {action.icon}
              {action.label}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
