import type { Position, System } from "../spec/types";

// Map units (where homes sit), not visual sizes.
const YOU_DISTANCE = 210;
const HOME_CLEARANCE = 170;
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

// Scenery is decoration only: it must never sit on a home, its status card or a line.
const SCENERY_STEP = 90;
const SCENERY_MARGIN = 220;
const SCENERY_MAX = 12;
const CLUTTER_STEP = 70;
const CLUTTER_MAX = 28;
const GROUND_PAD = 900;
const SCENERY_HOME_X = 110;
const SCENERY_HOME_ABOVE = 190;
const SCENERY_HOME_BELOW = 110;
const SCENERY_LINE_CLEARANCE = 55;

export type SceneryItem = Position & { id: string; variant: number };

// A stable pseudo-random number per spot, so trees don't jump around on every render.
function hash(x: number, y: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

export function placeScenery(system: System, you: Position): SceneryItem[] {
  const homes = [...system.agents.map((a) => a.position), you];
  const positions = new Map(system.agents.map((a) => [a.id, a.position]));
  const segments: [Position, Position][] = [];
  for (const line of system.lines) {
    const a = positions.get(line.from);
    const b = positions.get(line.to);
    if (a && b) segments.push([a, b]);
  }
  const overseer = system.agents.find((a) => a.kind === "overseer");
  if (overseer) segments.push([you, overseer.position]);

  const xs = homes.map((p) => p.x);
  const ys = homes.map((p) => p.y);
  const spots: (SceneryItem & { rank: number })[] = [];
  for (let x = Math.min(...xs) - SCENERY_MARGIN; x <= Math.max(...xs) + SCENERY_MARGIN; x += SCENERY_STEP) {
    for (let y = Math.min(...ys) - SCENERY_MARGIN; y <= Math.max(...ys) + SCENERY_MARGIN; y += SCENERY_STEP) {
      const jitter = hash(x, y);
      const spot = { x: x + (jitter - 0.5) * SCENERY_STEP * 0.6, y: y + (hash(y, x) - 0.5) * SCENERY_STEP * 0.6 };
      const nearHome = homes.some(
        (h) => Math.abs(spot.x - h.x) < SCENERY_HOME_X && spot.y > h.y - SCENERY_HOME_ABOVE && spot.y < h.y + SCENERY_HOME_BELOW,
      );
      const nearLine = segments.some(([a, b]) => distanceToSegment(spot, a, b) < SCENERY_LINE_CLEARANCE);
      if (!nearHome && !nearLine) spots.push({ ...spot, id: `${x},${y}`, variant: Math.floor(jitter * 1000), rank: jitter });
    }
  }
  return spots
    .sort((a, b) => a.rank - b.rank)
    .slice(0, SCENERY_MAX)
    .sort((a, b) => a.y - b.y)
    .map(({ rank: _rank, ...item }) => item);
}

export function placeClutter(system: System, you: Position): SceneryItem[] {
  const homes = [...system.agents.map((a) => a.position), you];
  const positions = new Map(system.agents.map((a) => [a.id, a.position]));
  const segments: [Position, Position][] = [];
  for (const line of system.lines) {
    const a = positions.get(line.from);
    const b = positions.get(line.to);
    if (a && b) segments.push([a, b]);
  }
  const overseer = system.agents.find((a) => a.kind === "overseer");
  if (overseer) segments.push([you, overseer.position]);

  const xs = homes.map((p) => p.x);
  const ys = homes.map((p) => p.y);
  const spots: (SceneryItem & { rank: number })[] = [];
  for (let x = Math.min(...xs) - SCENERY_MARGIN; x <= Math.max(...xs) + SCENERY_MARGIN; x += CLUTTER_STEP) {
    for (let y = Math.min(...ys) - SCENERY_MARGIN; y <= Math.max(...ys) + SCENERY_MARGIN; y += CLUTTER_STEP) {
      const jitter = hash(x + 3, y + 7);
      if (jitter < 0.35) continue;
      const spot = { x: x + (jitter - 0.5) * CLUTTER_STEP * 0.7, y: y + (hash(y + 1, x) - 0.5) * CLUTTER_STEP * 0.7 };
      const nearHome = homes.some(
        (h) => Math.abs(spot.x - h.x) < SCENERY_HOME_X && spot.y > h.y - SCENERY_HOME_ABOVE && spot.y < h.y + SCENERY_HOME_BELOW,
      );
      const nearLine = segments.some(([a, b]) => distanceToSegment(spot, a, b) < SCENERY_LINE_CLEARANCE);
      if (!nearHome && !nearLine) spots.push({ ...spot, id: `c-${x},${y}`, variant: Math.floor(jitter * 1000), rank: jitter });
    }
  }
  return spots
    .sort((a, b) => a.rank - b.rank)
    .slice(0, CLUTTER_MAX)
    .sort((a, b) => a.y - b.y)
    .map(({ rank: _rank, ...item }) => item);
}

export function groundRect(system: System, you: Position): { x: number; y: number; width: number; height: number } {
  const homes = [...system.agents.map((a) => a.position), you];
  const xs = homes.map((p) => p.x);
  const ys = homes.map((p) => p.y);
  const left = Math.min(...xs) - GROUND_PAD;
  const top = Math.min(...ys) - GROUND_PAD;
  return {
    x: left,
    y: top,
    width: Math.max(...xs) - left + GROUND_PAD,
    height: Math.max(...ys) - top + GROUND_PAD,
  };
}
