export type TerrainType =
  | "pavement"
  | "field"
  | "shrubland"
  | "debris"
  | "forest"
  | "foliage"
  | "swamp"
  | "shallows"
  | "blocking"
  | "indoors";

export type TerrainVisibility =
  | "unlimited"
  | "none"
  | number;

export interface TerrainProfile {
  type: TerrainType;
  rangedAttackModifier:
    number | null;
  coverArmorLevel:
    number | null;
  visibilityHexes:
    TerrainVisibility;
  blocking: boolean;
}

const TERRAIN_PROFILES: Record<TerrainType, TerrainProfile> =
  Object.fromEntries(
    COMBAT_TERRAIN_DATA.map((terrain) => [
      terrain.id,
      {
        type: terrain.id,
        rangedAttackModifier: terrain.rangedAttackModifier,
        coverArmorLevel: terrain.coverArmorLevel,
        visibilityHexes: terrain.visibilityHexes,
        blocking: terrain.blocksGroundMovement,
      },
    ]),
  ) as Record<TerrainType, TerrainProfile>;

export function getTerrainProfile(
  type: TerrainType,
): TerrainProfile {
  return TERRAIN_PROFILES[type];
}

export function parseTerrainType(
  value: unknown,
): TerrainType | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  switch (normalized) {
    case "pavement":
      return "pavement";
    case "field":
      return "field";
    case "shrubland":
      return "shrubland";
    case "debris":
      return "debris";
    case "forest":
      return "forest";
    case "foliage":
      return "foliage";
    case "swamp":
      return "swamp";
    case "shallows":
      return "shallows";
    case "blocking":
      return "blocking";
    case "indoors":
      return "indoors";
    default:
      return undefined;
  }
}
import { COMBAT_TERRAIN_DATA } from "../rule-data/terrain-and-travel";
