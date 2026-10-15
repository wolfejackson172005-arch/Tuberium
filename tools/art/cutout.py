"""Turn generated sprites on a magenta background into transparent, cropped PNGs.

Usage (from the repo root):
    .venv\\Scripts\\python.exe tools\\art\\cutout.py <input image> <output png> [--size 256]

"Magenta-ness" is how much red and blue both beat green. The background is very magenta;
sprite colors (red roofs, blue roofs, white critters, green trees) are not, so it keys cleanly
even through JPEG noise.
"""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image

LOW = 40.0
HIGH = 110.0
PADDING = 6


def cut_out(src: Path, dst: Path, size: int) -> None:
    rgb = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    magenta = np.minimum(r, b) - g
    alpha = 1.0 - np.clip((magenta - LOW) / (HIGH - LOW), 0.0, 1.0)

    # Edge pixels keep a pink fringe; pull their red and blue back toward green.
    spill = np.clip(magenta, 0.0, None) * (alpha < 1.0)
    out = np.stack([r - spill, g, b - spill, alpha * 255.0], axis=-1)
    out = np.clip(out, 0, 255).astype(np.uint8)

    ys, xs = np.nonzero(alpha > 0.05)
    top, bottom = max(ys.min() - PADDING, 0), min(ys.max() + PADDING + 1, out.shape[0])
    left, right = max(xs.min() - PADDING, 0), min(xs.max() + PADDING + 1, out.shape[1])
    sprite = Image.fromarray(out[top:bottom, left:right], "RGBA")
    sprite.thumbnail((size, size), Image.Resampling.LANCZOS)

    dst.parent.mkdir(parents=True, exist_ok=True)
    sprite.save(dst, optimize=True)
    print(f"{dst} {sprite.size[0]}x{sprite.size[1]}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("src", type=Path)
    parser.add_argument("dst", type=Path)
    parser.add_argument("--size", type=int, default=256)
    args = parser.parse_args()
    cut_out(args.src, args.dst, args.size)


if __name__ == "__main__":
    main()
