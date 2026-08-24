#!/usr/bin/env python3
"""Recreate a battlemap from standalone individual 2 m hex-tile data.

Example:
  python scripts/recreate_battlemap_from_2m_tiles.py ^
    --data battlemap-01-2m-hex-tiles.json ^
    --tile-images assets/battlemap-01/movement-hexes ^
    --background-root "C:\\...\\t2k4e-coreset\\assets\\scenes" ^
    --output battlemap-01-recreated-from-2m-data.png
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=Path("battlemap-01-2m-hex-tiles.json"))
    parser.add_argument("--tile-images", type=Path, default=Path("assets/battlemap-01/movement-hexes"))
    parser.add_argument("--background-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("battlemap-01-recreated-from-2m-data.png"))
    parser.add_argument("--transparent-background", action="store_true", help="Do not use the scene background beneath the child tiles.")
    return parser.parse_args()


def main() -> None:
    options = parse_arguments()
    with options.data.open(encoding="utf-8") as handle:
        data = json.load(handle)
    scene = data["scene"]
    canvas_size = (scene["width"], scene["height"])

    if options.transparent_background:
        canvas = Image.new("RGBA", canvas_size)
    else:
        background_name = Path(scene["backgroundImage"]).name
        canvas = Image.open(options.background_root / background_name).convert("RGBA")
        if canvas.size != canvas_size:
            raise ValueError("Scene background dimensions do not match the data.")

    for tile in data["hexTiles"]:
        image_path = options.tile_images / Path(tile["image"]).name
        image = Image.open(image_path).convert("RGBA")
        center = tile["center"]
        canvas.alpha_composite(
            image,
            (round(center["x"] - image.width / 2), round(center["y"] - image.height / 2)),
        )

    options.output.parent.mkdir(parents=True, exist_ok=True)
    if options.output.suffix.lower() == ".png":
        canvas.save(options.output)
    elif options.output.suffix.lower() == ".webp":
        canvas.save(options.output, "WEBP", quality=95, method=6)
    else:
        raise ValueError("Output must be .png or .webp")
    print(f"Recreated map from {len(data['hexTiles'])} individual 2 m images: {options.output}")


if __name__ == "__main__":
    main()
