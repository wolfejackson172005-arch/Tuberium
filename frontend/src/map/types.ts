import type { Edge, Node } from "@xyflow/react";
import type { Agent } from "../spec/types";
import type { AgentRunState, RunStatus } from "../run/useRun";

// Generics: Node<Data, Type> tells React Flow what `data` looks like for each node type.
export type HomeData = { agent: Agent; run: AgentRunState; selected: boolean };
export type HomeNode = Node<HomeData, "home">;

export type YouData = {
  selected: boolean;
  runStatus: RunStatus;
  result?: string;
  costUsd?: number;
  error?: string;
};
export type YouNode = Node<YouData, "you">;

export type MapNode = HomeNode | YouNode;

export type PathData = { oneWay: boolean; lit: boolean };
export type PathEdgeType = Edge<PathData, "path">;

export const YOU_ID = "you";
