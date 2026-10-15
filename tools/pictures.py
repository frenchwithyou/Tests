"""Prepare exam pictures: black and white, 4:3, light JPEG.

Usage:
  python3 tools/pictures.py single  <image> <out.jpg> [WIDTHxHEIGHT]      one scene (default 1040x780)
  python3 tools/pictures.py collage <image> <out-prefix> [WIDTHxHEIGHT]   a 2x2 collage -> <prefix>-a.jpg ... -d.jpg
                                                                         (default 720x540; order: top left, top right,
                                                                          bottom left, bottom right)
"""
import sys
from PIL import Image, ImageFilter, ImageOps

try:
    import numpy as np
except ImportError:  # numpy is only needed to find the collage borders
    np = None


def bw(im):
    return ImageOps.autocontrast(ImageOps.grayscale(im), cutoff=(0.2, 0.4))


def cover(im, w, h, inset=4):
    im = im.crop((inset, inset, im.width - inset, im.height - inset))
    r = w / h
    if im.width / im.height > r:
        nw = round(im.height * r); x = (im.width - nw) // 2; im = im.crop((x, 0, x + nw, im.height))
    else:
        nh = round(im.width / r); y = (im.height - nh) // 2; im = im.crop((0, y, im.width, y + nh))
    return im.resize((w, h), Image.LANCZOS)


def save(im, path, w, h):
    bw(cover(im, w, h)).filter(ImageFilter.GaussianBlur(0.5)).save(path, "JPEG", quality=70, optimize=True, progressive=True)
    print("written", path)


def gutter(white, n):
    """Widest run of near-white lines in the middle third of the image."""
    best, run = None, None
    for i in range(n // 3, 2 * n // 3):
        if white[i] > 0.97:
            run = [run[0], i] if run and run[1] == i - 1 else [i, i]
            if not best or run[1] - run[0] > best[1] - best[0]:
                best = list(run)
    if not best:
        sys.exit("No white border found: is this a 2x2 collage?")
    return best


def collage(path, prefix, w, h):
    im = Image.open(path).convert("RGB")
    a = np.asarray(im.convert("L")) > 235
    (x0, x1), (y0, y1) = gutter(a.mean(axis=0), im.width), gutter(a.mean(axis=1), im.height)
    boxes = [(0, 0, x0, y0), (x1 + 1, 0, im.width, y0), (0, y1 + 1, x0, im.height), (x1 + 1, y1 + 1, im.width, im.height)]
    for letter, box in zip("abcd", boxes):
        save(im.crop(box), f"{prefix}-{letter}.jpg", w, h)


if __name__ == "__main__":
    if len(sys.argv) < 4 or sys.argv[1] not in ("single", "collage"):
        sys.exit(__doc__)
    mode, src, out = sys.argv[1:4]
    size = sys.argv[4] if len(sys.argv) > 4 else ("1040x780" if mode == "single" else "720x540")
    W, H = (int(v) for v in size.lower().split("x"))
    if mode == "single":
        save(Image.open(src).convert("RGB"), out, W, H)
    else:
        collage(src, out, W, H)
