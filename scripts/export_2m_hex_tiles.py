#!/usr/bin/env python3
"""Export every Foundry 2 m movement hex as an individual data object."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--layout", type=Path, default=Path("battlemap-01-terrain-layout.json"))
    parser.add_argument("--output", type=Path, default=Path("battlemap-01-2m-hex-tiles.json"))
    return parser.parse_args()


def main() -> None:
    options = parse_arguments()
    with options.layout.open(encoding="utf-8") as handle:
        layout = json.load(handle)

    tiles = []
    for source in layout["hexTiles"]:
        tile = {
            "id": source["id"],
            "grid": {"column": source["column"], "row": source["row"]},
            "center": source["center"],
            "mapHexId": source["mapHexId"],
            "image": source["graphicImage"],
            "terrain": source["gameplayTerrain"],
            "terrainWeights": source["terrainWeights"],
            "classification": source["classification"],
        }
        if "secondaryTerrain" in source:
            tile["secondaryTerrain"] = source["secondaryTerrain"]
            tile["transition"] = {
                "primaryCoverage": source["primaryCoverage"],
                "secondaryCoverage": source["secondaryCoverage"],
                "angle": source["transitionAngle"],
                "transitionImage": source["transitionImage"],
            }
        tiles.append(tile)

    dataset = {
        "schemaVersion": 1,
        "name": "Battlemap 01 — individual 2 m hex tiles",
        "scene": layout["scene"],
        "tileGrid": layout["tileGrid"],
        "source": {
            "layout": options.layout.name,
            "containerRule": "Each image is a clipped slice of continuous parent-container artwork.",
        },
        "hexTiles": tiles,
    }
    with options.output.open("w", encoding="utf-8") as handle:
        json.dump(dataset, handle, indent=2)
        handle.write("\n")
    print(f"Exported {len(tiles)} individual 2 m hex tile objects to {options.output}")


if __name__ == "__main__":
    main()
