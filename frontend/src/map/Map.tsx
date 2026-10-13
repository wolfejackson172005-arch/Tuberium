import {
  ReactFlow,
  ViewportPortal,
  useNodesState,
  type EdgeTypes,
  type NodeMouseHandler,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo } from "react";
import type { AgentRunState, RunView } from "../run/useRun";
import { lineBetween, overseerOf } from "../spec/graph";
import type { System } from "../spec/types";
import { AgentHome } from "./AgentHome";
import { PathEdge } from "./PathEdge";
import { BlockedFlashes, Traveler } from "./Traveler";
import { placeYou } from "./layout";
import { YOU_ID, type HomeNode, type MapNode, type PathEdgeType, type YouNode } from "./types";
import { YouHome } from "./YouHome";
import "./map.css";

// Declared outside the component so React Flow doesn't see "new" node types on every render.
const nodeTypes: NodeTypes = { home: AgentHome, you: YouHome };
const edgeTypes: EdgeTypes = { path: PathEdge };

const IDLE: AgentRunState = { status: "idle" };

function buildNodes(system: System): MapNode[] {
  const homes: HomeNode[] = system.agents.map((agent) => ({
    id: agent.id,
    type: "home",
    position: { ...agent.position },
    data: { agent, run: IDLE, selected: false },
  }));
  const you: YouNode = {
    id: YOU_ID,
    type: "you",
    position: placeYou(system),
    data: { selected: false, runStatus: "idle" },
  };
  return [you, ...homes];
}

interface Props {
  system: System;
  run: RunView;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

// Spec in, homes and lines out. Remount it (key={system.id}) to load a different system.
export function Map({ system, run, selectedId, onSelect }: Props) {
  const [nodes, , onNodesChange] = useNodesState<MapNode>(buildNodes(system));

  // Run state is merged into node data for display only; it never goes back into the spec.
  const displayNodes = useMemo(
    () =>
      nodes.map((node): MapNode => {
        if (node.type === "home") {
          return {
            ...node,
            data: { ...node.data, run: run.agents[node.id] ?? IDLE, selected: selectedId === node.id },
          };
        }
        if (node.type === "you") {
          return {
            ...node,
            data: {
              selected: selectedId === YOU_ID,
              runStatus: run.runStatus,
              result: run.result,
              costUsd: run.costUsd,
              error: run.error,
            },
          };
        }
        return node;
      }),
    [nodes, run.agents, run.runStatus, run.result, run.costUsd, run.error, selectedId],
  );

  const edges = useMemo((): PathEdgeType[] => {
    const overseer = overseerOf(system);
    const lit = new Set<string>();
    if (run.roadLit && overseer) {
      for (const agentId of run.road) {
        const line = lineBetween(system, overseer.id, agentId);
        if (line) lit.add(line.id);
      }
    }
    const lines: PathEdgeType[] = system.lines.map((line) => ({
      id: line.id,
      source: line.from,
      target: line.to,
      type: "path",
      data: { oneWay: line.twoWay === false, lit: lit.has(line.id) },
      selectable: false,
      focusable: false,
    }));
    if (overseer) {
      lines.push({
        id: "you-overseer",
        source: YOU_ID,
        target: overseer.id,
        type: "path",
        data: { oneWay: false, lit: false },
        selectable: false,
        focusable: false,
      });
    }
    return lines;
  }, [system, run.road, run.roadLit]);

  const centerOf = useCallback(
    (id: string) => nodes.find((n) => n.id === id)?.position,
    [nodes],
  );

  const handleNodeClick: NodeMouseHandler<MapNode> = useCallback((_, node) => onSelect(node.id), [onSelect]);

  return (
    <div className="map">
      <ReactFlow<MapNode, PathEdgeType>
        nodes={displayNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodeOrigin={[0.5, 0.5]}
        nodesConnectable={false}
        onNodeClick={handleNodeClick}
        onPaneClick={() => onSelect(null)}
        fitView
        fitViewOptions={{ padding: 0.35 }}
        minZoom={0.3}
      >
        <ViewportPortal>
          <BlockedFlashes flashes={run.blocked} centerOf={centerOf} />
          {run.travelers.map((traveler) => {
            const from = centerOf(traveler.from);
            const to = centerOf(traveler.to);
            if (!from || !to) return null;
            return <Traveler key={traveler.id} traveler={traveler} from={from} to={to} onDone={run.removeTraveler} />;
          })}
        </ViewportPortal>
      </ReactFlow>
    </div>
  );
}
