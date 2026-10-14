import { useEffect, useState } from "react";
import { getSystem, listSystems } from "../api";
import { mockRunStates } from "../mock/worlds";
import { toWorld, type World } from "./world";

export type WorldsState =
  | { status: "loading" }
  | { status: "ready"; worlds: World[] }
  | { status: "failed" };

// A custom hook: a function starting with "use" that bundles state and effects so any component can reuse them.
export function useWorlds(): { state: WorldsState; retry: () => void } {
  const [state, setState] = useState<WorldsState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listSystems()
      .then((list) => Promise.all(list.map((s) => getSystem(s.id))))
      .then((systems) => {
        if (!cancelled) setState({ status: "ready", worlds: systems.map((s) => toWorld(s, mockRunStates[s.id])) });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "failed" });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = () => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  };

  return { state, retry };
}
