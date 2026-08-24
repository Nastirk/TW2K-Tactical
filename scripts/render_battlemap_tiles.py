#!/usr/bin/env python3
r"""Render a TW2K terrain layout JSON into a standalone map image.

Example (PowerShell):
  & python scripts/render_battlemap_tiles.py `
    --layout battlemap-01-terrain-layout.json `
    --assets-root 'C:\Users\krist\AppData\Local\FoundryVTT\Data\modules\t2k4e-coreset\assets\scenes' `
    --mode reference `
    --terrain-overlay `
    --output battlemap-01-from-layout.png
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw


TERRAIN_COLOURS = {
    "field": (205, 190, 82),
    "foliage": (96, 176, 82),
    "forest": (34, 104, 56),
    "shrubland": (148, 140, 57),
    "debris": (122, 96, 69),
    "blocking": (74, 74, 74),
    "pavement": (170, 174, 183),
}


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compose a TW2K hex map from its terrain layout JSON."
    )
    parser.add_argument(
        "--layout",
        type=Path,
        default=Path("battlemap-01-terrain-layout.json"),
        help="Path to the terrain layout JSON.",
    )
    parser.add_argument(
        "--assets-root",
        type=Path,
        required=True,
        help="Directory containing terrain-*.webp (the t2k4e core-set scenes folder).",
    )
    parser.add_argument(
        "--transition-assets-root",
        type=Path,
        default=Path("assets/terrain-transitions"),
        help="Directory containing generated 55/45 transition graphics.",
    )
    parser.add_argument(
        "--sliced-assets-root",
        type=Path,
        default=Path("assets/battlemap-01/movement-hexes"),
        help="Directory containing movement-hex graphics baked from container artwork.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("battlemap-01-from-layout.png"),
        help="Output image path. Use .png or .webp.",
    )
    parser.add_argument(
        "--render-level",
        choices=("map", "movement"),
        default="map",
        help="Render 10 m mapHexes (default) or 2 m movement hexes.",
    )
    parser.add_argument(
        "--mode",
        choices=("reference", "tiles", "sliced"),
        default="reference",
        help="Render reference artwork (default), terrain sprites, or coherent movement-hex artwork slices.",
    )
    parser.add_argument(
        "--reference",
        type=Path,
        help="Optional battlemap artwork to preserve as the output background.",
    )
    parser.add_argument(
        "--draw-terrain",
        action="store_true",
        help="Draw non-field terrain images over --reference, or rebuild from tiles when no reference is supplied.",
    )
    parser.add_argument(
        "--terrain-overlay",
        action="store_true",
        help="Overlay translucent 2 m terrain cells on a reference-art render.",
    )
    parser.add_argument(
        "--overlay-opacity",
        type=int,
        default=72,
        help="Terrain overlay opacity from 0 to 255 (default: 72).",
    )
    parser.add_argument(
        "--quality",
        type=int,
        default=95,
        help="WebP quality from 0 to 100 (default: 95).",
    )
    return parser.parse_args()


def load_layout(layout_path: Path) -> dict[str, Any]:
    with layout_path.open(encoding="utf-8") as handle:
        layout = json.load(handle)
    if not layout.get("hexTiles"):
        raise ValueError("The layout must contain one or more hexTiles records.")
    return layout


def asset_path(virtual_path: str, assets_root: Path) -> Path:
    """Resolve a Foundry virtual asset reference in the supplied scenes directory."""
    path = assets_root / Path(virtual_path).name
    if not path.is_file():
        raise FileNotFoundError(f"Terrain image not found: {path}")
    return path


def draw_terrain_overlay(canvas: Image.Image, layout: dict[str, Any], opacity: int) -> None:
    """Draw semantic terrain cells while retaining the map's authored artwork."""
    grid = layout["tileGrid"]
    width = grid["tileWidth"]
    height = grid["tileHeight"]
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    for cell in layout["hexTiles"]:
        center = cell["center"]
        x, y = center["x"], center["y"]
        colour = TERRAIN_COLOURS[cell.get("terrain", cell["type"])]
        vertices = [
            (x - width / 2, y),
            (x - width / 4, y - height / 2),
            (x + width / 4, y - height / 2),
            (x + width / 2, y),
            (x + width / 4, y + height / 2),
            (x - width / 4, y + height / 2),
        ]
        draw.polygon(vertices, fill=(*colour, opacity), outline=(*colour, min(220, opacity + 60)))
    canvas.alpha_composite(overlay)


def main() -> None:
    arguments = parse_arguments()
    layout = load_layout(arguments.layout)
    scene = layout["scene"]
    if not 0 <= arguments.overlay_opacity <= 255:
        raise ValueError("--overlay-opacity must be between 0 and 255.")
    if arguments.mode == "sliced":
        render_tiles = layout["hexTiles"]
        tile_grid = layout["tileGrid"]
    elif arguments.render_level == "map":
        render_tiles = layout.get("mapHexes")
        tile_grid = layout.get("mapHexGrid")
    else:
        render_tiles = layout.get("hexTiles")
        tile_grid = layout.get("tileGrid")
    if not render_tiles or not tile_grid:
        raise ValueError(f"The layout does not define the requested {arguments.render_level} grid.")
    grid_size = tile_grid["tileWidth"]
    hex_height = tile_grid["tileHeight"]
    canvas_size = (scene["width"], scene["height"])
    assets_root = arguments.assets_root.resolve()
    transition_assets_root = arguments.transition_assets_root.resolve()
    sliced_assets_root = arguments.sliced_assets_root.resolve()

    if arguments.mode == "reference":
        reference_path = arguments.reference
        if reference_path is None:
            visual_plan = layout.get("visualPlan", {})
            reference_path = asset_path(
                visual_plan.get("referenceBase", scene["backgroundImage"]), assets_root
            )
        canvas = Image.open(reference_path).convert("RGBA")
        if canvas.size != canvas_size:
            raise ValueError("Reference image dimensions do not match the layout scene.")
        if arguments.terrain_overlay:
            draw_terrain_overlay(canvas, layout, arguments.overlay_opacity)
        arguments.output.parent.mkdir(parents=True, exist_ok=True)
        if arguments.output.suffix.lower() == ".webp":
            canvas.convert("RGB").save(arguments.output, quality=arguments.quality, method=6)
        elif arguments.output.suffix.lower() == ".png":
            canvas.save(arguments.output)
        else:
            raise ValueError("Output must have a .png or .webp extension.")
        print(f"Rendered reference artwork and {len(layout['hexTiles'])} terrain records to {arguments.output}")
        return

    if arguments.mode == "sliced":
        reference_path = arguments.reference
        if reference_path is None:
            visual_plan = layout.get("visualPlan", {})
            reference_path = asset_path(
                visual_plan.get("referenceBase", scene["backgroundImage"]), assets_root
            )
        canvas = Image.open(reference_path).convert("RGBA")
        if canvas.size != canvas_size:
            raise ValueError("Reference image dimensions do not match the layout scene.")
        for hex_tile in layout["hexTiles"]:
            graphic = hex_tile.get("graphicImage", hex_tile.get("image"))
            if not graphic:
                raise ValueError("Sliced rendering requires image or graphicImage records.")
            source = Image.open(sliced_assets_root / Path(graphic).name).convert("RGBA")
            center = hex_tile["center"]
            canvas.alpha_composite(
                source,
                (round(center["x"] - source.width / 2), round(center["y"] - source.height / 2)),
            )
        arguments.output.parent.mkdir(parents=True, exist_ok=True)
        if arguments.output.suffix.lower() == ".webp":
            canvas.save(arguments.output, "WEBP", quality=arguments.quality, method=6)
        elif arguments.output.suffix.lower() == ".png":
            canvas.save(arguments.output)
        else:
            raise ValueError("Output must have a .png or .webp extension.")
        print(f"Rendered {len(layout['hexTiles'])} coherent movement-hex artwork slices to {arguments.output}")
        return

    if arguments.reference:
        canvas = Image.open(arguments.reference).convert("RGBA")
        if canvas.size != canvas_size:
            raise ValueError("Reference image dimensions do not match the layout scene.")
    else:
        canvas = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    cache: dict[str, Image.Image] = {}

    def tile_image(virtual_path: str, rotation: int = 0) -> Image.Image:
        cache_key = f"{virtual_path}:{rotation}"
        if cache_key not in cache:
            if "assets/terrain-transitions/" in virtual_path:
                source_path = transition_assets_root / Path(virtual_path).name
            else:
                source_path = asset_path(virtual_path, assets_root)
            source = Image.open(source_path).convert("RGBA")
            image = source.resize(
                (grid_size, hex_height), Image.Resampling.LANCZOS
            )
            cache[cache_key] = image.rotate(rotation, resample=Image.Resampling.BICUBIC)
        return cache[cache_key]

    # When rebuilding without a reference, create a field base for every cell.
    # Terrain images such as debris have transparent areas, so this guarantees
    # those hexes retain ground below.
    field_image = layout["terrainAssets"]["field"]
    if not arguments.reference:
        for hex_tile in render_tiles:
            center = hex_tile["center"]
            destination = (
                round(center["x"] - grid_size / 2),
                round(center["y"] - hex_height / 2),
            )
            canvas.alpha_composite(tile_image(field_image), destination)

    if arguments.draw_terrain or not arguments.reference:
        # Overlay each cell's assigned terrain. Field cells have already been drawn.
        for hex_tile in render_tiles:
            if hex_tile["type"] == "field" and not hex_tile.get("transitionImage"):
                continue
            center = hex_tile["center"]
            destination = (
                round(center["x"] - grid_size / 2),
                round(center["y"] - hex_height / 2),
            )
            canvas.alpha_composite(
                tile_image(
                    hex_tile.get("transitionImage", hex_tile["image"]),
                    hex_tile.get("rotation", 0),
                ),
                destination,
            )

    arguments.output.parent.mkdir(parents=True, exist_ok=True)
    if arguments.output.suffix.lower() == ".webp":
        canvas.convert("RGB").save(arguments.output, quality=arguments.quality, method=6)
    elif arguments.output.suffix.lower() == ".png":
        canvas.save(arguments.output)
    else:
        raise ValueError("Output must have a .png or .webp extension.")

    print(f"Rendered {len(render_tiles)} {arguments.render_level} hex tiles to {arguments.output}")


if __name__ == "__main__":
    main()
