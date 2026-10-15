"""Make a photo into a repeating tile by blending opposite edges."""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


def wrap_blend(a: np.ndarray, axis: int, blend: int) -> None:
    n = a.shape[axis]
    for i in range(blend):
        t = i / max(blend - 1, 1)
        near = [slice(None)] * a.ndim
        far = [slice(None)] * a.ndim
        near[axis] = i
        far[axis] = n - blend + i
        mixed = a[tuple(near)] * t + a[tuple(far)] * (1.0 - t)
        a[tuple(near)] = mixed
        a[tuple(far)] = mixed


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("src", type=Path)
    parser.add_argument("dst", type=Path)
    parser.add_argument("--size", type=int, default=512)
    parser.add_argument("--blend", type=int, default=64)
    args = parser.parse_args()

    img = Image.open(args.src).convert("RGB").resize((args.size, args.size), Image.Resampling.LANCZOS)
    a = np.asarray(img).astype(np.float32)
    wrap_blend(a, 0, args.blend)
    wrap_blend(a, 1, args.blend)
    args.dst.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGB").save(args.dst, optimize=True)
    print(f"{args.dst} {args.size}x{args.size}")


if __name__ == "__main__":
    main()
