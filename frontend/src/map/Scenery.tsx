import type { CSSProperties } from "react";
import { useTheme } from "../themes/useTheme";
import type { SceneryItem } from "./layout";

// Decorative props from the theme pack, drawn in map coordinates. Purely visual: no clicks, no meaning.
export function Scenery({
  trees,
  clutter,
}: {
  trees: SceneryItem[];
  clutter: SceneryItem[];
}) {
  const theme = useTheme();
  const treeArt = theme.scenery ?? [];
  const clutterArt = theme.clutter ?? [];

  return (
    <div className="scenery" aria-hidden="true">
      {clutterArt.length > 0 &&
        clutter.map((item) => (
          <img
            key={item.id}
            className="scenery__item scenery__item--clutter"
            src={clutterArt[item.variant % clutterArt.length]}
            alt=""
            draggable={false}
            style={{ left: `${item.x}px`, top: `${item.y}px` }}
          />
        ))}
      {treeArt.length > 0 &&
        trees.map((item) => (
          <img
            key={item.id}
            className="scenery__item scenery__item--tree"
            src={treeArt[item.variant % treeArt.length]}
            alt=""
            draggable={false}
            style={
              {
                left: `${item.x}px`,
                top: `${item.y}px`,
                "--sway-delay": `${(item.variant % 30) / 10}s`,
              } as CSSProperties
            }
          />
        ))}
    </div>
  );
}
