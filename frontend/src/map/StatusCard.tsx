import { REVIEW_MARKS } from "../spec/permissions";
import type { AgentRunState } from "../run/useRun";
import { useTheme } from "../themes/useTheme";

interface Props {
  art: string;
  name: string;
  run: AgentRunState;
}

export function StatusCard({ art, name, run }: Props) {
  const theme = useTheme();
  const { status, step, steps, doing, lastReview } = run;
  const hasProgress = step !== undefined && steps !== undefined && steps > 0;
  const fraction = hasProgress ? Math.min(1, step / steps) : 0;

  return (
    <div className="status-card">
      <div className="status-card__header">
        <span className="status-card__icon">{art}</span>
        <span className="status-card__name">{name}</span>
        {lastReview && (
          <span
            className={`status-card__review status-card__review--${lastReview.verdict}`}
            title={`${lastReview.verdict}: ${lastReview.note}`}
          >
            {REVIEW_MARKS[lastReview.verdict]}
          </span>
        )}
      </div>
      <div className="status-card__progress-row">
        <div className="status-card__bar">
          <div className="status-card__fill" style={{ width: `${fraction * 100}%` }} />
        </div>
        <span className="status-card__count">{hasProgress ? `${step}/${steps}` : "–"}</span>
      </div>
      <div className="status-card__doing">
        <span className={`status-card__status status-card__status--${status}`}>{theme.statusWords[status]}</span>
        {doing && <span className="status-card__doing-text">{doing}</span>}
      </div>
    </div>
  );
}
