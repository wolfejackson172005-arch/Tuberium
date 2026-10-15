// Shape of a theme pack, from docs/THEMES.md. Themes change the look, never the meaning.

export type AgentStatus = "idle" | "working" | "traveling" | "waiting" | "done" | "failed";

export type ThemeId = "tuberian" | "business" | "factory" | "jungle" | "swamp";

export interface Skin {
  title: string;
  art: string; // an emoji, or an image path under /art/
  prop?: string; // small icon that tells same-looking homes apart
}

export interface ThemePack {
  id: ThemeId;
  name: string;
  vars: Record<string, string>; // CSS variables: colors, fonts, radii, line widths
  home: "cottage" | "circle" | "machine" | "treehouse" | "lilypad";
  line: "path" | "plain" | "conveyor" | "vine" | "reeds";
  skins: Record<string, Skin>; // keyed by template, plus "overseer", "you" and "default"
  traveler: string;
  carrying: { message: string; file: string };
  statusWords: Record<AgentStatus, string>;
  scenery?: string[]; // tall decoration (trees), never on a home or a line
  clutter?: string[]; // rocks, grass tufts — smaller, denser, no sway
  ground?: string; // tiled grass (or other floor) image under the village
}

export function skinFor(pack: ThemePack, key: string | undefined): Skin {
  return (key !== undefined ? pack.skins[key] : undefined) ?? pack.skins.default;
}

export function isImageArt(art: string): boolean {
  return art.startsWith("/");
}
