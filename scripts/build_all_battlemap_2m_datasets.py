#!/usr/bin/env python3
"""Create one Foundry-aligned 2m terrain dataset for every Core Set battlemap.

Map 01 is imported from the hand-reviewed layout already present in this module.
The remaining maps use colour sampling as a first-pass classifier and are explicitly
marked for review.  This preserves a useful, complete grid now without claiming that
automatic image recognition can replace a human terrain pass.
"""

from __future__ import annotations

import argparse
import json
import math
from collections import Counter
from pathlib import Path
from typing import Any

try:
    from PIL import Image
except ImportError as error:  # pragma: no cover - environment diagnostic
    raise SystemExit("Pillow is required. Install it with: python -m pip install pillow") from error


SCHEMA_VERSION = "1.0.0"
MODULE_PATH = "modules/tw2k-tactical"
CORESET_PATH = "modules/t2k4e-coreset/assets/scenes"
TERRAIN_TYPES = (
    "pavement", "field", "shrubland", "debris", "forest", "foliage",
    "swamp", "shallows", "blocking", "indoors",
)


def load_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as source:
        return json.load(source)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as target:
        json.dump(payload, target, indent=2)
        target.write("\n")


def clamp(value: int, low: int, high: int) -> int:
    return max(low, min(high, value))


def rgb_to_hsv(red: int, green: int, blue: int) -> tuple[float, float, float]:
    maximum = max(red, green, blue) / 255
    minimum = min(red, green, blue) / 255
    delta = maximum - minimum
    if delta == 0:
        hue = 0.0
    elif maximum == red / 255:
        hue = ((green - blue) / 255 / delta) % 6
    elif maximum == green / 255:
        hue = (blue - red) / 255 / delta + 2
    else:
        hue = (red - green) / 255 / delta + 4
    return hue * 60, 0 if maximum == 0 else delta / maximum, maximum


def classify_pixel(rgb: tuple[int, int, int]) -> str:
    """A deliberately conservative terrain classifier for first-pass review data."""
    red, green, blue = rgb
    hue, saturation, value = rgb_to_hsv(red, green, blue)

    # Water is visually distinct in the Core Set artwork.
    if blue > red * 1.12 and blue > green * 1.03 and value > 0.25:
        return "shallows"
    # Streets, roofs, concrete and very dark interior artwork.
    if saturation < 0.12:
        return "indoors" if value < 0.30 else "pavement"
    if value < 0.20:
        return "indoors"
    # Dense tree canopy is much darker than the field base.
    if 65 <= hue <= 165 and value < 0.33:
        return "forest"
    if 65 <= hue <= 165 and saturation > 0.34 and value < 0.56:
        return "foliage"
    if 55 <= hue <= 175 and value < 0.66:
        return "shrubland"
    # Grey/brown rubble and ruined urban areas.
    if saturation < 0.25 and value < 0.62:
        return "debris"
    # Yellow-green base art is normally open field.
    return "field"


def sample_points() -> list[tuple[float, float]]:
    """Flat-top hex sample points in unit-radius local coordinates."""
    points = [(0.0, 0.0)]
    for radius, count in ((0.28, 6), (0.52, 12), (0.75, 18)):
        for index in range(count):
            angle = math.tau * index / count
            x = radius * math.cos(angle)
            y = radius * math.sin(angle)
            # flat-top hex: abs(x) <= 1 and abs(y) <= sqrt(3)/2, with sloped sides
            if abs(y) <= math.sqrt(3) / 2 and abs(x) + abs(y) / math.sqrt(3) <= 1:
                points.append((x, y))
    return points


SAMPLE_POINTS = sample_points()


def sampled_weights(image: Image.Image, center: dict[str, float], radius: float) -> dict[str, float]:
    counts: Counter[str] = Counter()
    width, height = image.size
    pixels = image.load()
    for normal_x, normal_y in SAMPLE_POINTS:
        x = clamp(round(center["x"] + normal_x * radius), 0, width - 1)
        y = clamp(round(center["y"] + normal_y * radius), 0, height - 1)
        pixel = pixels[x, y]
        counts[classify_pixel(tuple(pixel[:3]))] += 1
    total = sum(counts.values())
    return {terrain: round(count / total, 2) for terrain, count in counts.items()}


def normalize_weights(weights: dict[str, float]) -> dict[str, float]:
    """Round to 5% steps, retaining mixed cells such as 55/45 road boundaries."""
    ordered = sorted(weights.items(), key=lambda item: item[1], reverse=True)
    if not ordered:
        return {"field": 1.0}
    primary, primary_value = ordered[0]
    secondary = [(terrain, value) for terrain, value in ordered[1:] if value >= 0.10]
    if not secondary:
        return {primary: 1.0}
    secondary_name, secondary_value = secondary[0]
    total = primary_value + secondary_value
    primary_percent = int(round((primary_value / total) * 20) * 5)
    primary_percent = min(95, max(5, primary_percent))
    return {primary: primary_percent / 100, secondary_name: (100 - primary_percent) / 100}


def terrain_composition(weights: dict[str, float]) -> list[dict[str, Any]]:
    return [
        {"type": terrain, "percentage": round(weight * 100)}
        for terrain, weight in sorted(weights.items(), key=lambda item: item[1], reverse=True)
    ]


def source_crop(center: dict[str, float], size: float, dimensions: tuple[int, int]) -> dict[str, int]:
    width, height = dimensions
    tile_width = round(size)
    tile_height = round(size * math.sqrt(3) / 2)
    return {
        "x": clamp(round(center["x"] - tile_width / 2), 0, width - tile_width),
        "y": clamp(round(center["y"] - tile_height / 2), 0, height - tile_height),
        "width": tile_width,
        "height": tile_height,
    }


def map_id(number: int) -> str:
    return f"battlemap_{number:02d}"


def import_map_one(layout: dict[str, Any], source_name: str, dimensions: tuple[int, int]) -> list[dict[str, Any]]:
    cells: list[dict[str, Any]] = []
    for original in layout["hexTiles"]:
        cell = dict(original)
        weights = cell.get("terrainWeights") or {cell.get("terrain", "field"): 1.0}
        cell.update({
            "terrain": cell.get("gameplayTerrain", cell.get("terrain", "field")),
            "type": cell.get("gameplayTerrain", cell.get("type", "field")),
            "terrainWeights": normalize_weights(weights),
            "terrainComposition": terrain_composition(normalize_weights(weights)),
            "art": {
                "mode": "source-crop",
                "sourceImage": f"{CORESET_PATH}/{source_name}",
                "crop": source_crop(cell["center"], layout["scene"]["grid"]["size"], dimensions),
                "mask": "flat-top-hex",
            },
            "features": cell.get("features", []),
            "review": {"needsReview": False, "source": "battlemap-01-curated-layout"},
        })
        cells.append(cell)
    return cells


def classify_map_cells(template_cells: list[dict[str, Any]], image: Image.Image, source_name: str,
                       grid_size: float) -> list[dict[str, Any]]:
    cells: list[dict[str, Any]] = []
    dimensions = image.size
    for template in template_cells:
        weights = normalize_weights(sampled_weights(image, template["center"], grid_size / 2))
        primary = max(weights, key=weights.get)
        cell = {
            "id": template["id"],
            "column": template["column"],
            "row": template["row"],
            "center": template["center"],
            "mapHexId": template.get("mapHexId"),
            "terrain": primary,
            "type": primary,
            "gameplayTerrain": primary,
            "coverage": weights[primary],
            "terrainWeights": weights,
            "terrainComposition": terrain_composition(weights),
            "image": f"{CORESET_PATH}/terrain-{primary}.webp",
            "rotation": 0,
            "featureIds": [],
            "features": [],
            "graphicImage": None,
            "graphicMode": "source-crop",
            "art": {
                "mode": "source-crop",
                "sourceImage": f"{CORESET_PATH}/{source_name}",
                "crop": source_crop(template["center"], grid_size, dimensions),
                "mask": "flat-top-hex",
            },
            "classification": {
                "source": "automatic-image-sampling",
                "method": "colour-sampling-v1",
                "confidence": 0.35,
            },
            "review": {
                "needsReview": True,
                "reasons": ["Automatic first pass; review terrain mix and feature placement."],
            },
        }
        cells.append(cell)
    return cells


def containers(template_containers: list[dict[str, Any]], cells: list[dict[str, Any]]) -> list[dict[str, Any]]:
    known_ids = {cell["id"] for cell in cells}
    result: list[dict[str, Any]] = []
    for template in template_containers:
        parent = dict(template)
        children = [child for child in template.get("movementHexIds", []) if child in known_ids]
        child_cells = [cell for cell in cells if cell["id"] in children]
        totals: Counter[str] = Counter()
        for child in child_cells:
            for terrain, weight in child["terrainWeights"].items():
                totals[terrain] += weight
        weights = normalize_weights({terrain: value / len(child_cells) for terrain, value in totals.items()}) if child_cells else {"field": 1.0}
        primary = max(weights, key=weights.get)
        parent.update({
            "movementHexIds": children,
            "childHexIds": children,
            "primaryType": primary,
            "type": primary,
            "terrainMix": weights,
            "terrainComposition": terrain_composition(weights),
            "artworkMode": "continuous-source-crops",
        })
        result.append(parent)
    return result


def dataset(scene_name: str, source_name: str, dimensions: tuple[int, int], layout: dict[str, Any],
            cells: list[dict[str, Any]], parent_hexes: list[dict[str, Any]], curated: bool) -> dict[str, Any]:
    grid = layout["scene"]["grid"]
    return {
        "schemaVersion": SCHEMA_VERSION,
        "scene": {
            "id": scene_name,
            "name": scene_name.replace("_", " ").title(),
            "sourceImage": f"{CORESET_PATH}/{source_name}",
            "width": dimensions[0],
            "height": dimensions[1],
            "grid": grid,
            "movementGrid": {
                "foundryGridType": 4,
                "orientation": "flat-top-odd-column",
                "distance": 2,
                "units": "m",
                "size": grid["size"],
                "offset": grid["offset"],
            },
            "logicalScale": {
                "containerHexDistance": 10,
                "movementHexDistance": 2,
                "movementPerContainerDistance": 5,
                "note": "Container membership follows the existing Foundry-aligned Map 01 geometry; boundary overlap can yield six referenced movement cells.",
            },
        },
        "terrainAssets": {terrain: f"{CORESET_PATH}/terrain-{terrain}.webp" for terrain in TERRAIN_TYPES},
        "terrainRules": layout.get("terrainRules", {}),
        "terrainFeatures": {
            "note": "Terrain determines modifiers. Walls, buildings, fences, and line-of-sight segments belong in a separate feature/wall pass.",
            "walls": [],
        },
        "mapHexes": parent_hexes,
        "hexTiles": cells,
        "quality": {
            "terrainClassification": "curated" if curated else "automatic-first-pass",
            "reviewRequired": not curated,
            "featureExtraction": "not-yet-analysed",
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", required=True, type=Path, help="Core Set scenes directory")
    parser.add_argument("--output-dir", default=Path("data/battlemaps"), type=Path)
    parser.add_argument("--layout", default=Path("battlemap-01-terrain-layout.json"), type=Path)
    arguments = parser.parse_args()

    layout = load_json(arguments.layout)
    source_files = sorted(arguments.source_dir.glob("battlemap_*.webp"))
    if not source_files:
        raise SystemExit(f"No battlemap_*.webp files found in {arguments.source_dir}")
    template_cells = layout["hexTiles"]
    template_containers = layout["mapHexes"]
    grid_size = layout["scene"]["grid"]["size"]
    index_maps: list[dict[str, Any]] = []

    for source_path in source_files:
        scene_name = source_path.stem
        with Image.open(source_path) as image_source:
            image = image_source.convert("RGB")
            dimensions = image.size
            if scene_name == "battlemap_01":
                cells = import_map_one(layout, source_path.name, dimensions)
                curated = True
            else:
                cells = classify_map_cells(template_cells, image, source_path.name, grid_size)
                curated = False
        parent_hexes = containers(template_containers, cells)
        payload = dataset(scene_name, source_path.name, dimensions, layout, cells, parent_hexes, curated)
        output_path = arguments.output_dir / f"{scene_name}_2m.json"
        write_json(output_path, payload)
        index_maps.append({
            "id": scene_name,
            "dataset": output_path.name,
            "sourceImage": f"{CORESET_PATH}/{source_path.name}",
            "dimensions": {"width": dimensions[0], "height": dimensions[1]},
            "movementHexes": len(cells),
            "containerHexes": len(parent_hexes),
            "classification": "curated" if curated else "automatic-first-pass",
        })
        print(f"Wrote {output_path} ({len(cells)} movement hexes)")

    write_json(arguments.output_dir / "index.json", {
        "schemaVersion": SCHEMA_VERSION,
        "description": "Core Set battlemaps represented as Foundry-aligned 2m movement hexes.",
        "maps": index_maps,
    })


if __name__ == "__main__":
    main()
