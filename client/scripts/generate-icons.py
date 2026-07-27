#!/usr/bin/env python3
"""
Regenerate the site icons from the official GATES logomark.

    pip install pillow
    python client/scripts/generate-icons.py

Why a dark tile rather than the bare mark: the logomark is an *outline* star, so
at 16-32px there is very little ink, and its pale teal and orange strokes wash
out against light browser chrome. Placing it on the brand near-black tile gives
a consistent silhouette on both light and dark chrome without altering the mark
itself. A bolded/dilated variant was tried and looked muddy — don't reach for it.
"""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/assets/logos/gates-logomark.png"
PUBLIC = ROOT / "public"

TILE_BG = (13, 15, 22, 255)
#: Fraction of the tile the mark occupies. 0.80 keeps the star points clear of
#: the corners and stays inside Android's maskable safe zone.
ART_SCALE = 0.80
CORNER_RADIUS = 0.22
#: Supersample factor — draw large, then downsample for clean edges.
SS = 4


def build_master(size: int = 512) -> Image.Image:
    """Crop the logomark to its visible bounds and centre it on a square canvas."""
    art = Image.open(SOURCE).convert("RGBA")
    bbox = art.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    cropped = art.crop(bbox)

    side = max(cropped.size)
    pad = int(side * 0.02)
    box = side + pad * 2
    master = Image.new("RGBA", (box, box), (0, 0, 0, 0))
    master.paste(cropped, ((box - cropped.width) // 2, (box - cropped.height) // 2), cropped)
    return master.resize((size, size), Image.LANCZOS)


def tile(master: Image.Image, size: int, rounded: bool = True) -> Image.Image:
    big = size * SS
    canvas = Image.new("RGBA", (big, big), (0, 0, 0, 0))

    if rounded:
        mask = Image.new("L", (big, big), 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            [0, 0, big - 1, big - 1], radius=int(big * CORNER_RADIUS), fill=255
        )
    else:
        mask = Image.new("L", (big, big), 255)

    canvas.paste(Image.new("RGBA", (big, big), TILE_BG), (0, 0), mask)

    inner = int(big * ART_SCALE)
    art = master.resize((inner, inner), Image.LANCZOS)
    offset = (big - inner) // 2
    canvas.paste(art, (offset, offset), art)

    return canvas.resize((size, size), Image.LANCZOS)


def main() -> None:
    master = build_master()

    # Downsampled by Pillow into each embedded size.
    tile(master, 256).save(PUBLIC / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    tile(master, 16).save(PUBLIC / "favicon-16x16.png", optimize=True)
    tile(master, 32).save(PUBLIC / "favicon-32x32.png", optimize=True)
    # iOS applies its own rounding and ignores alpha, so ship a flat square.
    tile(master, 180, rounded=False).convert("RGB").save(PUBLIC / "apple-touch-icon.png", optimize=True)
    tile(master, 192).save(PUBLIC / "icon-192.png", optimize=True)
    tile(master, 512).save(PUBLIC / "icon-512.png", optimize=True)

    print(f"Wrote 6 icons to {PUBLIC}")


if __name__ == "__main__":
    main()
