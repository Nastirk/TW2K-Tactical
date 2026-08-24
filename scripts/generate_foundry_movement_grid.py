#!/usr/bin/env python3
"""Generate one terrain object per Foundry type-4 movement hex."""

from __future__ import annotations

import json
import math
from pathlib import Path


LAYOUT_PATH = Path("battlemap-01-terrain-layout.json")
PRIORITY = {
    "field": 0,
    "foliage": 1,
    "shrubland": 2,
    "debris": 3,
    "forest": 4,
    "pavement": 5,
    "blocking": 6,
}


def terrain_at(layout: dict, x: float, y: float) -> str:
    terrain_type = "field"
    for area in layout["tiles"]:
        if area["coverage"] == "entire-scene":
            continue
        if (
            area["x"] <= x < area["x"] + area["width"]
            and area["y"] <= y < area["y"] + area["height"]
            and PRIORITY[area["type"]] > PRIORITY[terrain_type]
        ):
            terrain_type = area["type"]
    return terrain_type


def main() -> None:
    with LAYOUT_PATH.open(encoding="utf-8") as source:
        layout = json.load(source)

    scene = layout["scene"]
    grid = scene["grid"]
    size = grid["size"]
    hex_height = size * math.sqrt(3) / 2
    origin_x = grid["offset"]["x"] + size / 2
    origin_y = grid["offset"]["y"] + hex_height / 2
    hex_tiles = []

    column = -2
    while True:
        x = origin_x + column * size * 0.75
        if x > scene["width"]:
            break
        row = 0
        while True:
            y = origin_y + row * hex_height + (hex_height / 2 if column % 2 else 0)
            if y > scene["height"]:
                break
            terrain_type = terrain_at(layout, x, y)
            hex_tiles.append(
                {
                    "id": f"movement-c{column}-r{row}",
                    "column": column,
                    "row": row,
                    "center": {"x": round(x, 3), "y": round(y, 3)},
                    "type": terrain_type,
                    "image": layout["terrainAssets"][terrain_type],
                    "rotation": 0,
                }
            )
            row += 1
        column += 1

    layout["schemaVersion"] = 4
    layout["tileGrid"] = {
        "orientation": "flat-top-odd-column",
        "foundryGridType": 4,
        "tileWidth": size,
        "tileHeight": round(hex_height),
        "columnStep": size * 0.75,
        "origin": {"x": origin_x, "y": origin_y},
    }
    layout["hexTiles"] = hex_tiles
    layout["notes"] = [
        "hexTiles contains one object for each Foundry type-4 movement hex whose center falls inside the scene.",
        "The supplied battlemap_01.webp is the visual background; these objects provide terrain type and image metadata for its movement grid.",
    ]

    with LAYOUT_PATH.open("w", encoding="utf-8") as destination:
        json.dump(layout, destination, indent=2)
        destination.write("\n")
    print(f"Generated {len(hex_tiles)} Foundry movement hex records.")


if __name__ == "__main__":
    main()
