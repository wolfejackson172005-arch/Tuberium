import { swamp } from "./swamp";
import { tuberian } from "./tuberian";
import type { ThemeId, ThemePack } from "./types";

export const themes: ThemePack[] = [tuberian, swamp];

export const defaultTheme = tuberian;

export function findTheme(id: string | null): ThemePack {
  return themes.find((t) => t.id === id) ?? defaultTheme;
}

export type { ThemeId, ThemePack };
