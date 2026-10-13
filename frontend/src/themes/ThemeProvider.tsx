import { useEffect, type ReactNode } from "react";
import type { ThemePack } from "./types";
import { ThemeContext } from "./useTheme";

export function ThemeProvider({ pack, children }: { pack: ThemePack; children: ReactNode }) {
  // useEffect runs after render: write the pack's variables onto <html>, and clear them on change.
  useEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(pack.vars)) {
      root.style.setProperty(name, value);
    }
    root.dataset.home = pack.home;
    root.dataset.line = pack.line;
    return () => {
      for (const name of Object.keys(pack.vars)) {
        root.style.removeProperty(name);
      }
    };
  }, [pack]);

  return <ThemeContext.Provider value={pack}>{children}</ThemeContext.Provider>;
}
