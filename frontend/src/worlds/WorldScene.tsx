// A small drawn preview of a world for the card thumbnails. Every fill comes from
// --scene-* variables in worlds.css, so a card can recolor it by setting those variables.

type Point = { x: number; y: number };
type Prop = Point & { kind: "pine" | "bush" | "rock" | "tuft" };

interface Layout {
  houses: (Point & { flip?: boolean })[];
  // Each pair is one line between two houses: a web of separate links, never a merged road.
  lines: [number, number][];
  props: Prop[];
}

// The village is drawn inside W x H and centered; sky and grass run far past the edges
// so cards of any width show a full scene instead of cropping houses.
const W = 300;
const H = 128;
const BLEED = 600;
const HOUSE_SCALE = 1.25;
const CRITTER_SCALE = 1.3;

const LAYOUTS: Layout[] = [
  {
    houses: [{ x: 48, y: 104 }, { x: 150, y: 70 }, { x: 252, y: 102, flip: true }],
    lines: [[0, 1], [1, 2]],
    props: [
      { kind: "pine", x: 200, y: 64 },
      { kind: "bush", x: 16, y: 80 },
      { kind: "rock", x: 104, y: 114 },
      { kind: "tuft", x: 212, y: 118 },
      { kind: "tuft", x: 84, y: 76 },
    ],
  },
  {
    houses: [{ x: 52, y: 82 }, { x: 248, y: 78, flip: true }, { x: 156, y: 112 }],
    lines: [[0, 1], [0, 2]],
    props: [
      { kind: "pine", x: 108, y: 62 },
      { kind: "pine", x: 292, y: 104 },
      { kind: "bush", x: 214, y: 112 },
      { kind: "rock", x: 22, y: 110 },
      { kind: "tuft", x: 120, y: 94 },
    ],
  },
  {
    houses: [{ x: 54, y: 106 }, { x: 142, y: 70 }, { x: 246, y: 104, flip: true }],
    lines: [[0, 1], [1, 2], [0, 2]],
    props: [
      { kind: "pine", x: 196, y: 64 },
      { kind: "pine", x: 14, y: 76 },
      { kind: "bush", x: 290, y: 80 },
      { kind: "rock", x: 150, y: 118 },
      { kind: "tuft", x: 96, y: 78 },
    ],
  },
];

// A rolling band of land from far left to far right: flat in the bleed, one gentle wave in view.
function hills(edge: number, crest: number, end: number): string {
  return (
    `M ${-BLEED} ${edge} L 0 ${edge} Q ${W * 0.25} ${crest} ${W * 0.5} ${edge}` +
    ` T ${W} ${end} L ${W + BLEED} ${end} V ${H + BLEED} H ${-BLEED} Z`
  );
}

function control(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 18 };
}

function curve(a: Point, b: Point): string {
  const c = control(a, b);
  return `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`;
}

// A point part-way along the same curve, for placing critters on a line.
function along(a: Point, b: Point, t: number): Point {
  const c = control(a, b);
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
}

function Cottage({ x, y, flip = false }: Point & { flip?: boolean }) {
  return (
    <g
      className="scene__house"
      transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * HOUSE_SCALE} ${HOUSE_SCALE})`}
    >
      <ellipse className="scene__shadow" cx={0} cy={1} rx={21} ry={3.5} />
      <rect className="scene__chimney" x={7} y={-34} width={4.5} height={9} />
      <rect className="scene__wall" x={-14} y={-21} width={28} height={22} />
      <rect className="scene__trim" x={-14} y={-21} width={2.5} height={22} />
      <rect className="scene__trim" x={11.5} y={-21} width={2.5} height={22} />
      <polygon className="scene__roof" points="-18,-19 0,-36 18,-19" />
      <polygon className="scene__roof-edge" points="-18,-19 18,-19 16,-16 -16,-16" />
      <rect className="scene__door" x={-9.5} y={-12} width={7} height={13} rx={1.2} />
      <rect className="scene__window" x={1.5} y={-14} width={8} height={7} rx={0.8} />
    </g>
  );
}

function Critter({ x, y, tint }: Point & { tint: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${CRITTER_SCALE})`}>
      <ellipse className="scene__shadow" cx={0} cy={0.5} rx={5} ry={1.6} />
      <rect className={`scene__critter-body scene__critter-body--${tint}`} x={-3.5} y={-8} width={7} height={7.5} rx={2.5} />
      <circle className="scene__critter" cx={0} cy={-12.5} r={5.5} />
      <rect className="scene__shades" x={-4.8} y={-14} width={9.6} height={3.2} rx={1.6} />
    </g>
  );
}

function SceneProp({ kind, x, y }: Prop) {
  switch (kind) {
    case "pine":
      return (
        <g transform={`translate(${x} ${y})`}>
          <ellipse className="scene__shadow" cx={0} cy={1} rx={8} ry={2.2} />
          <rect className="scene__trunk" x={-1.5} y={-5} width={3} height={6} />
          <polygon className="scene__pine" points="-9,-4 0,-18 9,-4" />
          <polygon className="scene__pine" points="-7,-12 0,-25 7,-12" />
        </g>
      );
    case "bush":
      return (
        <g transform={`translate(${x} ${y})`}>
          <ellipse className="scene__shadow" cx={0} cy={1} rx={9} ry={2.2} />
          <circle className="scene__bush" cx={-4} cy={-4} r={5} />
          <circle className="scene__bush" cx={4} cy={-4} r={5} />
          <circle className="scene__bush" cx={0} cy={-8} r={5.5} />
        </g>
      );
    case "rock":
      return <ellipse className="scene__rock" cx={x} cy={y} rx={5} ry={3.2} />;
    case "tuft":
      return <path className="scene__tuft" d={`M ${x - 3} ${y} L ${x - 1.5} ${y - 3.5} L ${x} ${y} L ${x + 1.5} ${y - 4} L ${x + 3} ${y}`} />;
  }
}

export function WorldScene({ variant, blank = false }: { variant: number; blank?: boolean }) {
  const sky = <rect className="scene__sky" x={-BLEED} y={-BLEED} width={W + 2 * BLEED} height={H + 2 * BLEED} />;

  if (blank) {
    return (
      <svg className="scene scene--blank" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        {sky}
        <path className="scene__ground" d={hills(88, 74, 82)} />
        <path className="scene__path-edge" d="M 24 114 Q 140 80 246 106" />
        <Cottage x={262} y={110} flip />
      </svg>
    );
  }

  const layout = LAYOUTS[variant % LAYOUTS.length];
  const critters = layout.lines.slice(0, 2).map(([a, b], i) => ({
    ...along(layout.houses[a], layout.houses[b], i === 0 ? 0.42 : 0.6),
    tint: i + 1,
  }));

  // Draw back-to-front by y so nearer things overlap farther ones.
  const things = [
    ...layout.props.filter((p) => p.kind !== "tuft").map((p) => ({ y: p.y, node: <SceneProp key={`p-${p.x}-${p.y}`} {...p} /> })),
    ...layout.houses.map((h) => ({ y: h.y, node: <Cottage key={`h-${h.x}-${h.y}`} {...h} /> })),
    ...critters.map((c) => ({ y: c.y, node: <Critter key={`c-${c.x}-${c.y}`} {...c} /> })),
  ].sort((p, q) => p.y - q.y);

  return (
    <svg className="scene" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      {sky}
      <path className="scene__hill" d={hills(50, 34, 44)} />
      <path className="scene__ground" d={hills(62, 50, 58)} />
      {layout.props
        .filter((p) => p.kind === "tuft")
        .map((p) => (
          <SceneProp key={`t-${p.x}-${p.y}`} {...p} />
        ))}
      {layout.lines.map(([a, b]) => (
        <path key={`e-${a}-${b}`} className="scene__path-edge" d={curve(layout.houses[a], layout.houses[b])} />
      ))}
      {layout.lines.map(([a, b]) => (
        <path key={`f-${a}-${b}`} className="scene__path" d={curve(layout.houses[a], layout.houses[b])} />
      ))}
      {things.map((t) => t.node)}
    </svg>
  );
}
