import type { TravelHexTerrain } from "./travel-map-catalog";

export interface TravelHexCoordinates {
  row: number;
  column: number;
}

export interface TravelMapScenePoint {
  x: number;
  y: number;
}

export interface TravelHexRecord {
  id: string;
  coordinates: TravelHexCoordinates;
  printedGridReference: string;
  terrain: TravelHexTerrain | null;
  features: readonly string[];
  label: string | null;
}

export interface TravelHexDataset {
  mapId: string;
  hexes: readonly TravelHexRecord[];
}

/**
 * Three known printed cell centres establish the mapping between the visible
 * source-map geometry and its row/column offsets. This deliberately does not
 * depend on Foundry's display-grid configuration.
 */
export interface TravelMapGridCalibration {
  b1: TravelMapScenePoint;
  bf1: TravelMapScenePoint;
  b65: TravelMapScenePoint;
  bf65: TravelMapScenePoint;
  ad33: TravelMapScenePoint;
}

export type TravelHexTerrainResolution =
  | { status: "known"; terrain: TravelHexTerrain }
  | { status: "requires-gm-confirmation" }
  | { status: "not-found" };

export class TravelHexLookup {
  private readonly byCoordinates: ReadonlyMap<string, TravelHexRecord>;

  constructor(private readonly dataset: TravelHexDataset) {
    this.byCoordinates = new Map(
      dataset.hexes.map((hex) => [TravelHexLookup.coordinateKey(hex.coordinates), hex]),
    );
  }

  findAtScenePoint(
    scenePoint: TravelMapScenePoint,
    calibration: TravelMapGridCalibration,
  ): TravelHexRecord | undefined {
    const coordinates = this.toDatasetCoordinates(scenePoint, calibration);
    if (!coordinates) return undefined;

    return this.byCoordinates.get(TravelHexLookup.coordinateKey(coordinates));
  }

  resolveTerrain(hex: TravelHexRecord | undefined): TravelHexTerrainResolution {
    if (!hex) {
      return { status: "not-found" };
    }

    if (!hex.terrain) {
      return { status: "requires-gm-confirmation" };
    }

    return { status: "known", terrain: hex.terrain };
  }

  private static coordinateKey(coordinates: TravelHexCoordinates): string {
    return `${coordinates.row}:${coordinates.column}`;
  }

  private toDatasetCoordinates(
    scene: TravelMapScenePoint,
    calibration: TravelMapGridCalibration,
  ): TravelHexCoordinates | undefined {
    const topColumnSpacing = (calibration.bf1.x - calibration.b1.x) / 28;
    const bottomColumnSpacing = (calibration.bf65.x - calibration.b65.x) / 28;
    const centreDeltaY = calibration.ad33.y - (calibration.b1.y + calibration.b65.y) / 2;
    const normalisedY = (scene.y - calibration.b1.y) / (calibration.b65.y - calibration.b1.y);
    if (!Number.isFinite(normalisedY) || topColumnSpacing === 0 || bottomColumnSpacing === 0) return undefined;

    // The centre point corrects the small vertical bow visible on the scanned map.
    const rawRow = Math.max(0, Math.min(64, (normalisedY - (centreDeltaY / (calibration.b65.y - calibration.b1.y)) * 4 * normalisedY * (1 - normalisedY)) * 64));
    const row = Math.round(rawRow);
    const progress = row / 64;
    const columnSpacing = topColumnSpacing + (bottomColumnSpacing - topColumnSpacing) * progress;
    const rowOriginX = calibration.b1.x + (calibration.b65.x - calibration.b1.x) * progress;
    const oddRowShift = -columnSpacing / 2;
    const adjustedOriginX = rowOriginX + (Math.abs(row % 2) === 1 ? oddRowShift : 0);
    const rawColumn = (scene.x - adjustedOriginX) / columnSpacing;
    const column = Math.round(rawColumn);
    if (Math.abs(rawColumn - column) > 0.3 || Math.abs(rawRow - row) > 0.3) {
      return undefined;
    }

    return { row, column };
  }
}
