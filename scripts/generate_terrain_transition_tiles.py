#!/usr/bin/env python3
"""Generate deterministic 55/45 terrain-transition graphics for 2 m hexes.

Each ordered pair is emitted in six directions.  For example,
``field-55-pavement-45-angle-90.webp`` is field on 55% of the hex and
pavement on 45%, separated by a horizontal boundary.  Reversing the terrain
order provides the complementary 45/55 version without a second convention.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


TERRAINS = ("field", "foliage", "forest", "shrubland", "debris", "blocking", "pavement")
ANGLES = (0, 30, 60, 90, 120, 150)
TILE_SIZE = (108, 94)


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assets-root", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=Path("assets/terrain-transitions"))
    return parser.parse_args()


def hex_mask(size: tuple[int, int]) -> Image.Image:
    width, height = size
    mask = Image.new("L", size, 0)
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


def primary_mask(shape: tuple[int, int], mask: Image.Image, angle: int) -> Image.Image:
    """Return an in-hex mask containing exactly ~55% of hex pixels."""
    width, height = shape
    yy, xx = np.indices((height, width), dtype=np.float32)
    radians = math.radians(angle)
    projection = (xx - width / 2) * math.cos(radians) + (yy - height / 2) * math.sin(radians)
    in_hex = np.asarray(mask) > 0
    threshold = np.quantile(projection[in_hex], 0.55)
    result = np.where(in_hex & (projection <= threshold), 255, 0).astype(np.uint8)
    return Image.fromarray(result, "L")


def masked(image: Image.Image, mask: Image.Image) -> Image.Image:
    result = Image.new("RGBA", image.size)
    alpha = Image.composite(image.getchannel("A"), Image.new("L", image.size), mask)
    result.paste(image, mask=alpha)
    return result


def main() -> None:
    options = parse_arguments()
    options.output_dir.mkdir(parents=True, exist_ok=True)
    assets = {
        terrain: Image.open(options.assets_root / f"terrain-{terrain}.webp")
        .convert("RGBA")
        .resize(TILE_SIZE, Image.Resampling.LANCZOS)
        for terrain in TERRAINS
    }
    whole_hex = hex_mask(TILE_SIZE)
    manifest: list[dict[str, object]] = []
    for primary in TERRAINS:
        for secondary in TERRAINS:
            if primary == secondary:
                continue
            for angle in ANGLES:
                primary_part = primary_mask(TILE_SIZE, whole_hex, angle)
                secondary_part = Image.eval(primary_part, lambda value: 255 - value)
                image = Image.new("RGBA", TILE_SIZE)
                image.alpha_composite(masked(assets[secondary], secondary_part))
                image.alpha_composite(masked(assets[primary], primary_part))
                filename = f"terrain-{primary}-55-{secondary}-45-angle-{angle}.webp"
                image.save(options.output_dir / filename, "WEBP", quality=95, method=6)
                manifest.append(
                    {
                        "primary": primary,
                        "primaryCoverage": 0.55,
                        "secondary": secondary,
                        "secondaryCoverage": 0.45,
                        "angle": angle,
                        "file": filename,
                    }
                )
    with (options.output_dir / "manifest.json").open("w", encoding="utf-8") as handle:
        json.dump({"tileSize": TILE_SIZE, "transitions": manifest}, handle, indent=2)
        handle.write("\n")
    print(f"Generated {len(manifest)} transition tiles in {options.output_dir}")


if __name__ == "__main__":
    main()
