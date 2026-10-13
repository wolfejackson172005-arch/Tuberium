import type { Position, System } from "../spec/types";

// Map units (where homes sit), not visual sizes.
const YOU_DISTANCE = 160;
const HOME_CLEARANCE = 130;
const LINE_CLEARANCE = 70;
// Preferred directions from the overseer, in order: left, then the diagonals, then the rest.
const DIRECTIONS_DEG = [180, 135, 225, 90, 270, 45, 315, 0];

function distanceToSegment(p: Position, a: Position, b: Position): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

// The You home sits next to the overseer, in the first direction that doesn't land on a home or a line,
// so its line never looks merged with another one.
export function placeYou(system: System): Position {
  const overseer = system.agents.find((a) => a.kind === "overseer");
  const origin = overseer?.position ?? { x: 0, y: 0 };
  const positions = new Map(system.agents.map((a) => [a.id, a.position]));

  let best = { x: origin.x - YOU_DISTANCE, y: origin.y };
  let bestScore = -Infinity;
  for (const deg of DIRECTIONS_DEG) {
    const rad = (deg * Math.PI) / 180;
    const spot = { x: origin.x + Math.cos(rad) * YOU_DISTANCE, y: origin.y + Math.sin(rad) * YOU_DISTANCE };
    let score = Infinity;
    for (const agent of system.agents) {
      score = Math.min(score, Math.hypot(spot.x - agent.position.x, spot.y - agent.position.y) - HOME_CLEARANCE);
    }
    for (const line of system.lines) {
      const a = positions.get(line.from);
      const b = positions.get(line.to);
      if (a && b) score = Math.min(score, distanceToSegment(spot, a, b) - LINE_CLEARANCE);
    }
    if (score > 0) return spot;
    if (score > bestScore) {
      bestScore = score;
      best = spot;
    }
  }
  return best;
}
