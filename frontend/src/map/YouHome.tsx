import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useTheme } from "../themes/useTheme";
import { skinFor } from "../themes/types";
import type { YouNode } from "./types";

export function YouHome({ data }: NodeProps<YouNode>) {
  const theme = useTheme();
  const skin = skinFor(theme, "you");
  const message = data.error ?? data.result;

  return (
    <div className={data.selected ? "home home--you home--selected" : "home home--you"}>
      <Handle type="target" position={Position.Top} className="home__handle" isConnectable={false} />
      <Handle type="source" position={Position.Top} className="home__handle" isConnectable={false} />
      {message && (
        <div className={data.error ? "result-card result-card--error" : "result-card"}>
          <div className="result-card__title">{data.error ? "Something went wrong" : "Result"}</div>
          <div className="result-card__text">{message}</div>
        </div>
      )}
      <span className="home__art">{skin.art}</span>
      <div className="home__below">
        <span className="home__name">You</span>
      </div>
    </div>
  );
}
