import { isImageArt } from "../themes/types";

// Theme art is either an emoji placeholder or a sprite image; components don't care which.
export function ThemeArt({ art, className }: { art: string; className: string }) {
  if (isImageArt(art)) {
    return <img className={className} src={art} alt="" draggable={false} />;
  }
  return (
    <span className={className} aria-hidden="true">
      {art}
    </span>
  );
}
