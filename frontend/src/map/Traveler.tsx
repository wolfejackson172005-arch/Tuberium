import { useEffect, useState, type TransitionEvent } from "react";
import type { BlockedFlash, Traveler as TravelerData } from "../run/useRun";
import { useTheme } from "../themes/useTheme";

type Point = { x: number; y: number };

const PREVIEW_CHARS = 40;
// If the browser never reports the end of the walk (e.g. the tab was hidden), clean up anyway.
const SAFETY_MS = 4000;

function preview(text: string): string {
  return text.length > PREVIEW_CHARS ? `${text.slice(0, PREVIEW_CHARS)}…` : text;
}

interface Props {
  traveler: TravelerData;
  from: Point;
  to: Point;
  onDone: (id: string) => void;
}

// A critter walking from one home's center to the other's. Lives inside ViewportPortal, so x/y are map coordinates.
export function Traveler({ traveler, from, to, onDone }: Props) {
  const theme = useTheme();
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    // Wait two frames so the browser paints the start position before the CSS transition begins.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setArrived(true));
    });
    const safety = window.setTimeout(() => onDone(traveler.id), SAFETY_MS);
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      window.clearTimeout(safety);
    };
  }, [onDone, traveler.id]);

  const handleEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && event.propertyName === "transform") {
      onDone(traveler.id);
    }
  };

  const at = arrived ? to : from;
  const carrying =
    traveler.files.length > 0
      ? `${theme.carrying.file} ${traveler.files.join(", ")}`
      : `${theme.carrying.message} ${preview(traveler.text)}`;

  return (
    <div className="traveler" style={{ transform: `translate(${at.x}px, ${at.y}px)` }} onTransitionEnd={handleEnd}>
      <div className={traveler.isReply ? "traveler__body traveler__body--reply" : "traveler__body"}>
        <div className="traveler__bubble">{carrying}</div>
        <span className="traveler__critter">{theme.traveler}</span>
      </div>
    </div>
  );
}

export function BlockedFlashes({ flashes, centerOf }: { flashes: BlockedFlash[]; centerOf: (id: string) => Point | undefined }) {
  return (
    <svg className="blocked-layer">
      {flashes.map((flash) => {
        const a = centerOf(flash.from);
        const b = centerOf(flash.to);
        if (!a || !b) return null;
        return <line key={flash.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="blocked-line" />;
      })}
    </svg>
  );
}
