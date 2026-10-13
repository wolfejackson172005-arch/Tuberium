import { ArrowRight } from "lucide-react";
import { mockApprovalCount, mockWorlds } from "../mock/worlds";
import { NewWorldCard } from "./NewWorldCard";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { WorldCard } from "./WorldCard";
import "./worlds.css";

export function WorldsPage() {
  const active = mockWorlds.filter((w) => w.active);
  const inactive = mockWorlds.filter((w) => !w.active);
  const running = mockWorlds.filter((w) => w.status === "running").length;

  return (
    <div className="worlds">
      <Sidebar activeId="worlds" />
      <div className="worlds__main">
        <TopBar
          title="Your Worlds"
          running={running}
          resting={mockWorlds.length - running}
          notifications={mockApprovalCount}
        />
        <div className="worlds__content">
          <section className="worlds-section" aria-labelledby="active-worlds">
            <div className="worlds-section__head">
              <h2 id="active-worlds">Active worlds</h2>
              <span className="worlds-section__hint">Little towns doing big things</span>
              <button type="button" className="worlds-section__link">
                View activity
                <ArrowRight className="icon icon--sm" />
              </button>
            </div>
            <div className="worlds-grid">
              <NewWorldCard />
              {active.map((world, i) => (
                <WorldCard key={world.id} world={world} index={i + 1} />
              ))}
            </div>
          </section>

          <section className="worlds-section" aria-labelledby="inactive-worlds">
            <div className="worlds-section__head">
              <h2 id="inactive-worlds">Inactive worlds</h2>
              <span className="worlds-section__hint">Paused, idle and still being built</span>
            </div>
            <div className="worlds-grid">
              {inactive.map((world, i) => (
                <WorldCard key={world.id} world={world} index={i} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
