import { Handle, Position, type NodeProps } from "@xyflow/react";
import { formatUsd } from "../run/cost";
import { useTheme } from "../themes/useTheme";
import { isImageArt, skinFor } from "../themes/types";
import { ThemeArt } from "./ThemeArt";
import type { YouNode } from "./types";

export function YouHome({ data }: NodeProps<YouNode>) {
  const theme = useTheme();
  const skin = skinFor(theme, "you");
  const message = data.error ?? data.result;
  const classes = ["home", "home--you"];
  if (isImageArt(skin.art)) classes.push("home--sprite");
  if (data.selected) classes.push("home--selected");

  return (
    <div className={classes.join(" ")}>
      <Handle type="target" position={Position.Top} className="home__handle" isConnectable={false} />
      <Handle type="source" position={Position.Top} className="home__handle" isConnectable={false} />
      {message && (
        <div className={data.error ? "result-card result-card--error" : "result-card"}>
          <div className="result-card__title">{data.error ? "Something went wrong" : "Result"}</div>
          <div className="result-card__text">{message}</div>
          {data.costUsd !== undefined && (
            <div className="result-card__cost">Run cost: {formatUsd(data.costUsd)}</div>
          )}
        </div>
      )}
      <ThemeArt art={skin.art} className="home__art" />
      <div className="home__below">
        <span className="home__name">You</span>
      </div>
    </div>
  );
}
