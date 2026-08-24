#!/usr/bin/env python3
"""Bake coherent 10 m container art and matching 2 m hex slices from a map image.

Unlike terrain sprites, each movement-hex image is clipped from the same
continuous reference artwork as its parent container.  Reassembling the child
images therefore recreates the road or terrain artwork within the container.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw


MODULE_ASSET_ROOT = "modules/tw2k-tactical/assets/battlemap-01"


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--layout", type=Path, default=Path("battlemap-01-terrain-layout.json"))
    parser.add_argument("--reference", type=Path, required=True)
    parser.add_argument("--output-root", type=Path, default=Path("assets/battlemap-01"))
    parser.add_argument("--child-start", type=int, default=0, help="Zero-based child index to start baking.")
    parser.add_argument("--child-count", type=int, help="Number of child graphics to bake in this batch.")
    parser.add_argument("--skip-containers", action="store_true", help="Do not rebuild parent container images.")
    parser.add_argument("--finalize", action="store_true", help="Write generated asset references into the layout JSON.")
    return parser.parse_args()


def hex_mask(width: int, height: int) -> Image.Image:
    mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(mask).polygon(
        [
            (0, height / 2),
            (width / 4, 0),
            (width * 3 / 4, 0),
            (width, height / 2),
            (width * 3 / 4, height),
            (width / 4, height),
        ],
        fill=255,
    )
    return mask


def crop_hex(reference: Image.Image, center: dict[str, float], width: int, height: int) -> Image.Image:
    left = round(center["x"] - width / 2)
    top = round(center["y"] - height / 2)
    result = Image.new("RGBA", (width, height))
    result.paste(reference, (-left, -top))
    result.putalpha(hex_mask(width, height))
    return result


def main() -> None:
    options = parse_arguments()
    with options.layout.open(encoding="utf-8") as handle:
        layout = json.load(handle)
    reference = Image.open(options.reference).convert("RGBA")
    scene = layout["scene"]
    if reference.size != (scene["width"], scene["height"]):
        raise ValueError("Reference image dimensions do not match the layout scene.")

    containers_dir = options.output_root / "containers"
    children_dir = options.output_root / "movement-hexes"
    containers_dir.mkdir(parents=True, exist_ok=True)
    children_dir.mkdir(parents=True, exist_ok=True)
    map_grid = layout["mapHexGrid"]
    movement_grid = layout["tileGrid"]
    parents = {map_hex["id"]: map_hex for map_hex in layout["mapHexes"]}

    if not options.skip_containers:
        for map_hex in layout["mapHexes"]:
            filename = f"{map_hex['id']}.png"
            crop_hex(reference, map_hex["center"], map_grid["tileWidth"], map_grid["tileHeight"]).save(
                containers_dir / filename, "PNG"
            )

    children = layout["hexTiles"]
    start = options.child_start
    stop = len(children) if options.child_count is None else min(len(children), start + options.child_count)
    for movement_hex in children[start:stop]:
        filename = f"{movement_hex['id']}.png"
        crop_hex(
            reference,
            movement_hex["center"],
            movement_grid["tileWidth"],
            movement_grid["tileHeight"],
        ).save(children_dir / filename, "PNG")

    if options.finalize:
        for map_hex in layout["mapHexes"]:
            filename = f"{map_hex['id']}.png"
            map_hex["containerImage"] = f"{MODULE_ASSET_ROOT}/containers/{filename}"
            map_hex["artworkMode"] = "continuous-container-slice"
        for movement_hex in children:
            filename = f"{movement_hex['id']}.png"
            parent = parents[movement_hex["mapHexId"]]
            movement_hex["graphicImage"] = f"{MODULE_ASSET_ROOT}/movement-hexes/{filename}"
            movement_hex["graphicMode"] = "container-slice"
            movement_hex["containerImage"] = parent["containerImage"]
            movement_hex["containerOffset"] = {
                "x": round(movement_hex["center"]["x"] - parent["center"]["x"], 3),
                "y": round(movement_hex["center"]["y"] - parent["center"]["y"], 3),
            }
        layout["schemaVersion"] = 10
        layout["visualPlan"]["reconstruction"] = {
            "mode": "container-sliced",
            "containerImages": f"{MODULE_ASSET_ROOT}/containers",
            "movementHexImages": f"{MODULE_ASSET_ROOT}/movement-hexes",
            "rule": "Each movement-hex graphic is a clipped slice of its parent container's continuous artwork.",
        }
        note = "containerImage and graphicImage are continuous artwork slices: compositing child graphics at their Foundry centres reconstructs the complete parent-container image."
        if note not in layout["notes"]:
            layout["notes"].append(note)
        with options.layout.open("w", encoding="utf-8") as handle:
            json.dump(layout, handle, indent=2)
            handle.write("\n")
    print(f"Baked {stop - start} movement-hex graphics ({start}..{stop - 1}).")


if __name__ == "__main__":
    main()
