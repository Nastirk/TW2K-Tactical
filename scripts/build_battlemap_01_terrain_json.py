#!/usr/bin/env python3
"""Assign battlemap_01 terrain-tile metadata to every Foundry movement hex."""

from __future__ import annotations

import argparse
import collections
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image


MACRO_TILE_WIDTH = 500
MACRO_TILE_HEIGHT = round(MACRO_TILE_WIDTH * math.sqrt(3) / 2)
MACRO_COLUMN_STEP = MACRO_TILE_WIDTH * 0.75
MOVEMENT_HEX_SIZE = 108


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--layout", type=Path, default=Path("battlemap-01-terrain-layout.json"))
    parser.add_argument("--reference", type=Path, required=True)
    parser.add_argument("--assets-root", type=Path, required=True)
    return parser.parse_args()


def macro_tile_type(reference: Image.Image, assets: dict[str, Image.Image], x: float, y: float) -> str:
    """Return the terrain sprite that best matches one visible 500 px map hex."""
    left = round(x - MACRO_TILE_WIDTH / 2)
    top = round(y - MACRO_TILE_HEIGHT / 2)
    sample = Image.new("RGB", (MACRO_TILE_WIDTH, MACRO_TILE_HEIGHT))
    sample.paste(reference, (-left, -top))
    target = np.asarray(
        sample.resize((70, 61), Image.Resampling.LANCZOS), dtype=np.float32
    )
    best_type = "field"
    best_score = math.inf
    for terrain_type, image in assets.items():
        rgba = np.asarray(image, dtype=np.float32)
        alpha = np.maximum(rgba[:, :, 3] / 255, 0.05)
        score = float(
            np.sum(((target - rgba[:, :, :3]) ** 2).mean(axis=2) * alpha)
            / np.sum(alpha)
        )
        if score < best_score:
            best_score = score
            best_type = terrain_type
    return best_type


def movement_hex_type(
    reference: Image.Image, parent_type: str, x: float, y: float
) -> tuple[str, float]:
    """Classify the visible terrain at a 2 m movement hex.

    The macro tile identifies the broad terrain family.  This local pass then
    recognises the pale, low-saturation road surface and the dense/diffuse dark
    green cover in the reference art.  Its result intentionally favours field
    for uncovered areas so an isolated forest/debris illustration does not make
    an entire 10 m parent impassable.
    """
    left = round(x - MOVEMENT_HEX_SIZE / 2)
    top = round(y - MOVEMENT_HEX_SIZE / 2)
    sample = Image.new("RGB", (MOVEMENT_HEX_SIZE, MOVEMENT_HEX_SIZE))
    sample.paste(reference, (-left, -top))
    pixels = np.asarray(sample, dtype=np.float32)
    red, green, blue = pixels[:, :, 0], pixels[:, :, 1], pixels[:, :, 2]
    brightness = pixels.mean(axis=2)
    chroma = pixels.max(axis=2) - pixels.min(axis=2)
    low_saturation = (chroma < 28) & (brightness > 105)
    road_coverage = float(low_saturation.mean())
    green_cover = (green > red * 1.12) & (green > blue * 1.04) & (brightness < 135)
    cover_coverage = float(green_cover.mean())

    if parent_type == "pavement" and road_coverage > 0.28:
        return "pavement", round(road_coverage, 4)
    if cover_coverage >= 0.22:
        return "forest", round(cover_coverage, 4)
    if cover_coverage >= 0.035:
        return "foliage", round(cover_coverage, 4)
    if parent_type in {"blocking", "debris", "shrubland"}:
        return parent_type, 0.65
    return "field", round(max(0.0, 1.0 - cover_coverage), 4)


def add_mixed_terrain_metadata(layout: dict) -> None:
    """Derive 10 m summaries and terrain regions from authoritative 2 m cells.

    A map hex deliberately has no assumed single terrain.  Its ``type`` becomes
    ``mixed`` when its children have more than one terrain type.  This makes the
    same file usable for authored maps and procedural generation: change the
    child cells (or replace the generated regions), then rerun this function to
    refresh the parent summaries.
    """
    children_by_parent: dict[str, list[dict]] = collections.defaultdict(list)
    for movement_hex in layout["hexTiles"]:
        movement_hex["terrain"] = movement_hex["type"]
        primary = movement_hex["terrain"]
        confidence = movement_hex["classification"]["confidence"]
        parent_terrain = movement_hex["classification"]["parentTerrain"]
        secondary: str | None = None
        angle = 0
        # Values near a visible terrain edge become deterministic 55/45 blends.
        # This is intentionally a discrete gameplay rule: the dominant 55% is
        # used by Foundry, while both components are retained for artwork.
        if primary == "pavement" and 0.30 <= confidence <= 0.70:
            secondary = "field"
            angle = 90 if abs(movement_hex["center"]["y"] - 2395) < 320 else 0
        elif primary == "forest" and 0.22 <= confidence <= 0.50:
            secondary = "field"
        elif primary == "foliage" and 0.05 <= confidence <= 0.12:
            secondary = "field"
        elif primary == "field" and parent_terrain == "pavement" and 0.30 <= confidence <= 0.70:
            secondary = "pavement"
            angle = 90 if abs(movement_hex["center"]["y"] - 2395) < 320 else 0

        weights = {primary: 1.0}
        if secondary and secondary != primary:
            weights = {primary: 0.55, secondary: 0.45}
            movement_hex["secondaryTerrain"] = secondary
            movement_hex["primaryCoverage"] = 0.55
            movement_hex["secondaryCoverage"] = 0.45
            movement_hex["transitionAngle"] = angle
            movement_hex["transitionImage"] = (
                f"modules/tw2k-tactical/assets/terrain-transitions/"
                f"terrain-{primary}-55-{secondary}-45-angle-{angle}.webp"
            )
        else:
            movement_hex.pop("secondaryTerrain", None)
            movement_hex.pop("primaryCoverage", None)
            movement_hex.pop("secondaryCoverage", None)
            movement_hex.pop("transitionAngle", None)
            movement_hex.pop("transitionImage", None)
        movement_hex["terrainWeights"] = weights
        movement_hex["gameplayTerrain"] = primary
        movement_hex.setdefault("coverage", 1.0)
        children_by_parent[movement_hex["mapHexId"]].append(movement_hex)

    regions = []
    for map_hex in layout["mapHexes"]:
        children = children_by_parent[map_hex["id"]]
        counts: collections.Counter[str] = collections.Counter()
        for child in children:
            counts.update(child["terrainWeights"])
        total = sum(counts.values())
        primary_type = max(counts, key=counts.get) if counts else "field"
        terrain_mix = {
            terrain_type: round(count / total, 4)
            for terrain_type, count in sorted(counts.items())
        } if total else {"field": 1.0}
        feature_id = f"terrain-region-{map_hex['id']}"

        for child in children:
            child["featureIds"] = [feature_id]

        map_hex["type"] = primary_type if len(counts) == 1 else "mixed"
        map_hex["primaryType"] = primary_type
        map_hex["terrainMix"] = terrain_mix
        map_hex["movementHexIds"] = [child["id"] for child in children]
        map_hex["image"] = layout["terrainAssets"][primary_type]
        regions.append(
            {
                "id": feature_id,
                "kind": "terrain-region",
                "terrain": primary_type,
                "sourceMapHexId": map_hex["id"],
                "hexIds": map_hex["movementHexIds"],
            }
        )

    layout["terrainFeatures"] = regions
    layout["terrainRules"] = {
        "authority": "hexTiles[].terrain",
        "parentSummary": "mapHexes[].terrainMix",
        "mixedParentType": "mixed",
        "selection": "Movement and terrain checks use the 2 m hex containing the token centre.",
        "mixedCellSelection": "For a 55/45 cell, use gameplayTerrain (the 55% primary terrain) unless a rule explicitly reads terrainWeights.",
        "proceduralGeneration": "Create overlapping terrainFeatures, rasterize them to 2 m cells, then derive mapHexes summaries.",
    }
    layout.setdefault("terrainOverrides", [])


def add_visual_plan(layout: dict) -> None:
    """Describe how a map is rendered without stamping an art tile per 2 m cell."""
    cells_by_terrain: dict[str, list[str]] = collections.defaultdict(list)
    for movement_hex in layout["hexTiles"]:
        cells_by_terrain[movement_hex["terrain"]].append(movement_hex["id"])

    feature_layers = []
    for terrain_type, hex_ids in sorted(cells_by_terrain.items()):
        if terrain_type == "field":
            continue
        feature_layers.append(
            {
                "id": f"visual-{terrain_type}",
                "kind": "terrain-mask",
                "terrain": terrain_type,
                "source": "hexTiles[].terrain",
                "hexIds": hex_ids,
                "rendering": {
                    "method": "continuous-mask",
                    "asset": layout["terrainAssets"][terrain_type],
                    "note": "Use the mask as one irregular feature; do not stamp this asset once per child hex.",
                },
            }
        )

    layout["visualPlan"] = {
        "version": 1,
        "mode": "reference-art-with-semantic-terrain",
        "referenceBase": layout["scene"]["backgroundImage"],
        "renderOrder": ["referenceBase", "optionalTerrainOverlay"],
        "gameplayAuthority": "hexTiles[].terrain",
        "proceduralStrategy": "Generate feature masks first, rasterize them to hexTiles, then render each mask as a continuous feature layer.",
        "featureLayers": feature_layers,
    }
    layout["transitionTileSet"] = {
        "assetRoot": "modules/tw2k-tactical/assets/terrain-transitions",
        "filenameTemplate": "terrain-{primary}-55-{secondary}-45-angle-{angle}.webp",
        "primaryCoverage": 0.55,
        "secondaryCoverage": 0.45,
        "angles": [0, 30, 60, 90, 120, 150],
        "note": "Each ordered pair is generated. Reverse primary/secondary for the complementary 45/55 visual.",
    }


def main() -> None:
    options = parse_arguments()
    with options.layout.open(encoding="utf-8") as source:
        layout = json.load(source)

    reference = Image.open(options.reference).convert("RGB")
    scene = layout["scene"]
    if reference.size != (scene["width"], scene["height"]):
        raise ValueError("Reference image dimensions do not match the scene.")

    overrides = {
        override["hexId"]: override
        for override in layout.get("terrainOverrides", [])
    }

    assets = {
        terrain_type: Image.open(options.assets_root / Path(image_path).name)
        .convert("RGBA")
        .resize((70, 61), Image.Resampling.LANCZOS)
        for terrain_type, image_path in layout["terrainAssets"].items()
    }
    macro_types: dict[tuple[int, int], str] = {}
    map_hexes = []
    for column in range(17):
        row = 0
        while True:
            center_y = row * MACRO_TILE_HEIGHT + (
                MACRO_TILE_HEIGHT / 2 if column % 2 else 0
            )
            if center_y > scene["height"]:
                break
            terrain_type = macro_tile_type(
                reference, assets, column * MACRO_COLUMN_STEP, center_y
            )
            macro_types[(column, row)] = terrain_type
            map_hexes.append(
                {
                    "id": f"map-c{column}-r{row}",
                    "column": column,
                    "row": row,
                    "center": {
                        "x": round(column * MACRO_COLUMN_STEP, 3),
                        "y": round(center_y, 3),
                    },
                    "type": terrain_type,
                    "image": layout["terrainAssets"][terrain_type],
                }
            )
            row += 1

    for movement_hex in layout["hexTiles"]:
        center = movement_hex["center"]
        column = min(16, max(0, round(center["x"] / MACRO_COLUMN_STEP)))
        vertical_offset = MACRO_TILE_HEIGHT / 2 if column % 2 else 0
        row = max(0, round((center["y"] - vertical_offset) / MACRO_TILE_HEIGHT))
        parent_type = macro_types.get((column, row), "field")
        terrain_type, confidence = movement_hex_type(
            reference, parent_type, center["x"], center["y"]
        )
        override = overrides.get(movement_hex["id"])
        if override:
            terrain_type = override["terrain"]
            confidence = 1.0
        movement_hex["type"] = terrain_type
        movement_hex["image"] = layout["terrainAssets"][terrain_type]
        movement_hex["mapHexId"] = f"map-c{column}-r{row}"
        movement_hex["rotation"] = 0
        movement_hex["classification"] = {
            "source": "manual-override" if override else "reference-image",
            "parentTerrain": parent_type,
            "confidence": confidence,
        }

    layout["mapHexes"] = map_hexes
    add_mixed_terrain_metadata(layout)
    add_visual_plan(layout)
    layout["schemaVersion"] = 9
    layout["mapHexGrid"] = {
        "tileWidth": MACRO_TILE_WIDTH,
        "tileHeight": MACRO_TILE_HEIGHT,
        "columnStep": MACRO_COLUMN_STEP,
        "distance": 10,
        "units": "m",
        "movementHexDistance": 2,
        "movementHexesAcross": 5,
        "purpose": "Authored 10 m terrain tile grid; movement uses scene.grid.",
    }
    layout["notes"] = [
        "mapHexes are 10 m summaries derived from their 2 m movement cells; a parent type is mixed when it contains multiple terrains.",
        "hexTiles contains one 2 m Foundry movement hex (scene.grid type 4, size 108); hexTiles[].terrain is the authoritative gameplay terrain.",
        "terrainFeatures records the authored terrain regions. For a mixed map hex, assign different terrain values to its child hexes and rerun the summary step.",
        "terrainOverrides may explicitly set a child terrain using {hexId, terrain}; overrides take precedence over reference-image classification on rebuild.",
        "visualPlan renders the declared reference artwork as the visual base; its featureLayers are continuous masks for future procedural artwork, never one sprite per 2 m movement hex.",
        "A blended movement hex carries terrainWeights, gameplayTerrain, and a transitionImage. The generated artwork is 55% primary terrain and 45% secondary terrain.",
    ]
    with options.layout.open("w", encoding="utf-8") as destination:
        json.dump(layout, destination, indent=2)
        destination.write("\n")

    counts: dict[str, int] = {}
    for terrain_type in macro_types.values():
        counts[terrain_type] = counts.get(terrain_type, 0) + 1
    print(f"Classified {len(layout['hexTiles'])} movement hexes from {len(macro_types)} source tiles: {counts}")


if __name__ == "__main__":
    main()
