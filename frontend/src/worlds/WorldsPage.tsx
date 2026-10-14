import { ArrowRight } from "lucide-react";
import { NewWorldCard } from "./NewWorldCard";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useWorlds } from "./useWorlds";
import { WorldCard } from "./WorldCard";
import "./worlds.css";

export function WorldsPage({ onOpen }: { onOpen: (id: string) => void }) {
  const { state, retry } = useWorlds();
  const worlds = state.status === "ready" ? state.worlds : [];
  const active = worlds.filter((w) => w.active);
  const inactive = worlds.filter((w) => !w.active);
  const running = worlds.filter((w) => w.status === "running").length;
  const approvals = worlds.filter((w) => w.approval).length;

  return (
    <div className="worlds">
      <Sidebar activeId="worlds" approvals={approvals} />
      <div className="worlds__main">
        <TopBar title="Your Worlds" running={running} resting={worlds.length - running} notifications={approvals} />
        <div className="worlds__content">
          {state.status === "loading" && <p className="worlds-notice">Loading your worlds…</p>}

          {state.status === "failed" && (
            <div className="worlds-notice">
              <h2>Can't reach the backend</h2>
              <p>Start it from the backend folder, then try again:</p>
              <code>uvicorn app.main:app --reload --port 8000</code>
              <button type="button" className="button button--primary" onClick={retry}>
                Try again
              </button>
            </div>
          )}

          {state.status === "ready" && (
            <>
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
                    <WorldCard key={world.id} world={world} index={i + 1} onOpen={onOpen} />
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
                    <WorldCard key={world.id} world={world} index={i} onOpen={onOpen} />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
