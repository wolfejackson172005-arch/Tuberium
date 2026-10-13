import { useInternalNode, type EdgeProps, type InternalNode } from "@xyflow/react";
import type { PathEdgeType } from "./types";

interface Circle {
  x: number;
  y: number;
  r: number;
}

function circleOf(node: InternalNode): Circle | null {
  const width = node.measured.width;
  const height = node.measured.height;
  if (width === undefined || height === undefined) return null;
  const { x, y } = node.internals.positionAbsolute;
  return { x: x + width / 2, y: y + height / 2, r: Math.min(width, height) / 2 };
}

// One straight themed segment per spec line, from the border of one home to the border of the other.
export function PathEdge({ source, target, data }: EdgeProps<PathEdgeType>) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  if (!sourceNode || !targetNode) return null;
  const a = circleOf(sourceNode);
  const b = circleOf(targetNode);
  if (!a || !b) return null;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  if (length <= a.r + b.r) return null;
  const ux = dx / length;
  const uy = dy / length;
  const start = { x: a.x + ux * a.r, y: a.y + uy * a.r };
  const end = { x: b.x - ux * b.r, y: b.y - uy * b.r };
  const d = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return (
    <g className={data?.lit ? "path-edge path-edge--lit" : "path-edge"}>
      <path d={d} className="path-edge__border" />
      <path d={d} className="path-edge__line" />
      {data?.oneWay && (
        <g transform={`translate(${end.x} ${end.y}) rotate(${angle})`}>
          <path d="M 0 0 L -1 -0.6 L -1 0.6 Z" className="path-edge__arrow" />
        </g>
      )}
    </g>
  );
}
