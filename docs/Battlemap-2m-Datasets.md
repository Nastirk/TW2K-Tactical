# Battlemap 2m terrain datasets

The datasets in `data/battlemaps/` describe the installed Core Set battle maps on
Foundry's 2 metre movement grid. Each file represents one source scene and is
listed in `data/battlemaps/index.json`.

## Structure

Each map file contains two connected layers:

- `mapHexes` contains the 10 metre map hex containers. A container records its
  representative terrain mix and the IDs of its child movement hexes.
- `hexTiles` contains every individual 2 metre Foundry movement hex. A tile
  includes its grid column and row, pixel centre, parent `mapHexId`, terrain,
  terrain mix, terrain graphic, and source-art crop metadata.

The Foundry grid is flat-top, odd-column hexes (`foundryGridType: 4`), has a
distance of 2 metres, and retains the original scene dimensions and grid
offset. `mapHexes` are organisational containers; gameplay should always read
the terrain of the occupied `hexTiles` entry.

## Terrain and transitions

`terrainWeights` and `terrainComposition` describe mixed terrain instead of
forcing a border hex into one category. For example, a road crossing field can
be represented as:

```json
{
  "terrain": "pavement",
  "gameplayTerrain": "pavement",
  "terrainWeights": { "pavement": 0.55, "field": 0.45 },
  "terrainComposition": [
    { "type": "pavement", "percentage": 55 },
    { "type": "field", "percentage": 45 }
  ]
}
```

Use `gameplayTerrain` for the one terrain type that applies to a token centred
in the 2 metre cell. The weights remain available for rendering transition
art, map generation, or alternative rules.

The canonical terrain IDs follow the Core Set reference tiles:
`pavement`, `field`, `shrubland`, `debris`, `forest`, `foliage`, `swamp`,
`shallows`, `blocking`, and `indoors`.

## Art and features

Every tile has an `art` object. `source-crop` means the renderer can reproduce
the tile by clipping that area from the supplied battlemap image with a
flat-top hex mask. Map 01 retains its reviewed `container-slice` layout and
therefore provides the best authored example for individual tile art.

Terrain classification and physical features are deliberately separate.
`features`/`featureIds` are for things such as walls, buildings, rubble, and
vegetation. A `blocking` terrain value alone should not create Foundry walls;
wall segments must be authored as explicit feature or wall data so line of
sight remains reliable.

## Review status

Battlemap 01 uses the existing reviewed terrain layout. The remaining maps are
an automatic first pass from the original full-resolution images and carry
`review.needsReview: true` on their movement hexes. That makes them usable as
a complete, consistent base dataset while clearly identifying the maps that
need art/terrain and feature refinement before a production release.

## Regenerating

Run the generator from the module root with the Core Set scene directory:

```powershell
& 'C:\Users\krist\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\build_all_battlemap_2m_datasets.py --source-dir 'C:\Users\krist\AppData\Local\FoundryVTT\Data\modules\t2k4e-coreset\assets\scenes' --output-dir 'data\battlemaps'
```

The generator detects every `battlemap_XX.webp` scene installed in that
directory. The currently installed Core Set provides battle maps 01 through
16. It preserves Map 01's reviewed layout when that layout exists alongside
the generator.
