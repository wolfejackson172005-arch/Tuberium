// A small drawn preview of a world for the card thumbnails. Every fill comes from
// --scene-* variables in worlds.css, so a card can recolor it by setting those variables.

type Point = { x: number; y: number };

interface Layout {
  houses: Point[];
  // Each pair is one line between two houses: a web of separate links, never a merged road.
  lines: [number, number][];
  trees: Point[];
}

const LAYOUTS: Layout[] = [
  {
    houses: [{ x: 40, y: 92 }, { x: 150, y: 70 }, { x: 262, y: 88 }],
    lines: [[0, 1], [1, 2]],
    trees: [{ x: 214, y: 62 }],
  },
  {
    houses: [{ x: 46, y: 80 }, { x: 255, y: 70 }, { x: 160, y: 104 }],
    lines: [[0, 1], [0, 2]],
    trees: [{ x: 110, y: 60 }],
  },
  {
    houses: [{ x: 60, y: 96 }, { x: 140, y: 66 }, { x: 250, y: 96 }],
    lines: [[0, 1], [1, 2], [0, 2]],
    trees: [{ x: 196, y: 60 }, { x: 22, y: 64 }],
  },
];

function curve(a: Point, b: Point): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - 16;
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
}

function House({ x, y }: Point) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect className="scene__wall" x={-12} y={-16} width={24} height={18} rx={2} />
      <polygon className="scene__roof" points="-16,-15 0,-29 16,-15" />
      <rect className="scene__door" x={-3.5} y={-8} width={7} height={10} rx={1.5} />
    </g>
  );
}

export function WorldScene({ variant, blank = false }: { variant: number; blank?: boolean }) {
  const layout = LAYOUTS[variant % LAYOUTS.length];

  if (blank) {
    return (
      <svg className="scene scene--blank" viewBox="0 0 300 128" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect className="scene__sky" width="300" height="128" />
        <path className="scene__ground" d="M0 84 Q 80 70 160 82 T 300 78 V128 H0 Z" />
        <path className="scene__path" d="M 30 104 Q 140 70 252 96" />
        <House x={262} y={98} />
      </svg>
    );
  }

  return (
    <svg className="scene" viewBox="0 0 300 128" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect className="scene__sky" width="300" height="128" />
      <path className="scene__ground" d="M0 64 Q 75 50 150 62 T 300 58 V128 H0 Z" />
      {layout.lines.map(([a, b]) => (
        <path key={`${a}-${b}`} className="scene__path" d={curve(layout.houses[a], layout.houses[b])} />
      ))}
      {layout.trees.map((t) => (
        <g key={`${t.x}-${t.y}`} transform={`translate(${t.x} ${t.y})`}>
          <rect className="scene__door" x={-1.5} y={0} width={3} height={8} />
          <circle className="scene__tree" r={8} />
        </g>
      ))}
      {layout.houses.map((h) => (
        <House key={`${h.x}-${h.y}`} x={h.x} y={h.y} />
      ))}
      {layout.lines.slice(0, 2).map(([a, b]) => {
        const p = layout.houses[a];
        const q = layout.houses[b];
        return <circle key={`c-${a}-${b}`} className="scene__critter" cx={(p.x + q.x) / 2} cy={(p.y + q.y) / 2 - 8} r={4} />;
      })}
    </svg>
  );
}
