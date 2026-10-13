import { Handle, Position, type NodeProps } from "@xyflow/react";
import { PERMISSIONS } from "../spec/permissions";
import { useTheme } from "../themes/useTheme";
import { skinFor } from "../themes/types";
import { StatusCard } from "./StatusCard";
import type { HomeNode } from "./types";

export function AgentHome({ data }: NodeProps<HomeNode>) {
  const theme = useTheme();
  const { agent, run, selected } = data;
  const skin = skinFor(theme, agent.kind === "overseer" ? "overseer" : agent.template);
  const badges = PERMISSIONS.filter((p) => (agent.permissions[p.name] ?? "off") !== "off");

  const classes = ["home", `home--${run.status}`];
  if (agent.kind === "overseer") classes.push("home--overseer");
  if (selected) classes.push("home--selected");

  return (
    <div className={classes.join(" ")}>
      <Handle type="target" position={Position.Top} className="home__handle" isConnectable={false} />
      <Handle type="source" position={Position.Top} className="home__handle" isConnectable={false} />
      <StatusCard art={skin.art} name={agent.name} run={run} />
      <span className="home__art">{skin.art}</span>
      <div className="home__below">
        <span className="home__name">{agent.name}</span>
        {badges.length > 0 && (
          <div className="home__badges">
            {badges.map((p) => {
              const level = agent.permissions[p.name];
              const active = run.activePermission === p.name;
              return (
                <span
                  key={p.name}
                  className={active ? "badge badge--active" : "badge"}
                  title={`${p.description} (${level === "ask" ? "ask me first" : "allowed"})`}
                >
                  {p.badge}
                  {level === "ask" && <span className="badge__ask-dot" />}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
