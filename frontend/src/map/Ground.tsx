import { useTheme } from "../themes/useTheme";

// Tiled grass (or other floor) in map coordinates so it pans and zooms with the village.
export function Ground({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  const theme = useTheme();
  if (!theme.ground) return null;
  return <div className="map-ground" style={{ left: x, top: y, width, height }} aria-hidden="true" />;
}
