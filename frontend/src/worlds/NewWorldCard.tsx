import { ArrowRight, Plus } from "lucide-react";
import { WorldScene } from "./WorldScene";

export function NewWorldCard() {
  return (
    <button type="button" className="world-card world-card--new">
      <span className="world-card__scene">
        <WorldScene variant={0} blank />
        <span className="world-card__plus" aria-hidden="true">
          <Plus className="icon" />
        </span>
      </span>
      <span className="world-card__new-body">
        <span>
          <span className="world-card__name">New world</span>
          <span className="world-card__new-hint">Start from a preset or build your own</span>
        </span>
        <ArrowRight className="icon" />
      </span>
    </button>
  );
}
