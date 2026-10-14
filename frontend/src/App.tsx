import { useCallback, useEffect, useState } from "react";
import { getSystem, listSystems } from "./api";
import { Map } from "./map/Map";
import { AgentPanel, YouPanel } from "./panel/AgentPanel";
import { useRun } from "./run/useRun";
import { InputsForm } from "./shell/InputsForm";
import { SettingsPanel } from "./shell/SettingsPanel";
import { Sidebar, type View } from "./shell/Sidebar";
import { TopBar } from "./shell/TopBar";
import { runnableTask } from "./spec/graph";
import type { System, SystemSummary } from "./spec/types";
import { findTheme, type ThemeId } from "./themes";
import { ThemeProvider } from "./themes/ThemeProvider";
import { YOU_ID } from "./map/types";
import "./shell/shell.css";

const THEME_KEY = "tuberium.theme";
const DEFAULT_SYSTEM = "hello-tubes";

// localStorage can throw (private mode, blocked storage), so every access is wrapped.
function loadThemeId(): string | null {
  try {
    return window.localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function saveThemeId(id: ThemeId): void {
  try {
    window.localStorage.setItem(THEME_KEY, id);
  } catch {
    // Not saved; the theme still applies for this session.
  }
}

type Loaded = { id: string; system: System } | { id: string; failed: true };

export default function App() {
  const [themeId, setThemeId] = useState<ThemeId>(() => findTheme(loadThemeId()).id);
  const [systemId, setSystemId] = useState(DEFAULT_SYSTEM);
  const [systems, setSystems] = useState<SystemSummary[]>([]);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<View>("home");
  const [askingInputs, setAskingInputs] = useState(false);
  const run = useRun();

  useEffect(() => {
    let cancelled = false;
    getSystem(systemId)
      .then((system) => !cancelled && setLoaded({ id: systemId, system }))
      .catch(() => !cancelled && setLoaded({ id: systemId, failed: true }));
    listSystems()
      .then((list) => !cancelled && setSystems(list))
      .catch(() => !cancelled && setSystems([]));
    return () => {
      cancelled = true;
    };
  }, [systemId, attempt]);

  const changeTheme = (id: ThemeId) => {
    setThemeId(id);
    saveThemeId(id);
  };

  const changeSystem = (id: string) => {
    run.clear();
    setAskingInputs(false);
    setSelectedId(null);
    setSystemId(id);
  };

  const closePanel = useCallback(() => setSelectedId(null), []);
  const closeSettings = useCallback(() => setView("home"), []);
  const cancelInputs = useCallback(() => setAskingInputs(false), []);

  const current = loaded?.id === systemId ? loaded : null;
  const system = current && "system" in current ? current.system : null;
  const task = system ? runnableTask(system) : undefined;

  const pressRun = () => {
    if (!system || !task) return;
    if (task.inputs && task.inputs.length > 0) setAskingInputs(true);
    else run.start(system.id, task.id, {});
  };

  const submitInputs = (inputs: Record<string, string>) => {
    setAskingInputs(false);
    if (system && task) run.start(system.id, task.id, inputs);
  };

  return (
    <ThemeProvider pack={findTheme(themeId)}>
      <div className="app">
        <TopBar
          systems={systems}
          systemId={systemId}
          onSystemChange={changeSystem}
          taskName={task?.name}
          onRun={pressRun}
          runStatus={run.runStatus}
          costUsd={run.costUsd}
        />
        <Sidebar view={view} onView={setView} />
        <main className="app__main">
          {system && (
            <Map
              key={system.id}
              system={system}
              run={run}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                if (id) setView("home");
              }}
            />
          )}
          {!current && <div className="notice">Loading…</div>}
          {current && "failed" in current && (
            <div className="notice">
              <h2>Can't reach the backend</h2>
              <p>Start it from the backend folder, then try again:</p>
              <code>uvicorn app.main:app --reload --port 8000</code>
              <button type="button" onClick={() => setAttempt((n) => n + 1)}>
                Try again
              </button>
            </div>
          )}
          {view === "settings" && (
            <SettingsPanel themeId={themeId} onThemeChange={changeTheme} onClose={closeSettings} />
          )}
          {view === "home" && system && selectedId === YOU_ID && (
            <YouPanel result={run.result} costUsd={run.costUsd} onClose={closePanel} />
          )}
          {view === "home" && system && selectedId && selectedId !== YOU_ID && (
            <AgentPanel
              system={system}
              agentId={selectedId}
              run={run.agents[selectedId]}
              events={run.events}
              onClose={closePanel}
            />
          )}
        </main>
        {askingInputs && task && <InputsForm task={task} onSubmit={submitInputs} onCancel={cancelInputs} />}
      </div>
    </ThemeProvider>
  );
}
