import { createContext, useContext } from "react";
import { defaultTheme } from "./index";
import type { ThemePack } from "./types";

// Context lets any component read the active pack without passing it down as a prop.
export const ThemeContext = createContext<ThemePack>(defaultTheme);

export function useTheme(): ThemePack {
  return useContext(ThemeContext);
}
