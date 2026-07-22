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

const TERRAIN_PROFILES:
  Record<TerrainType, TerrainProfile> = {
    pavement: {
      type: "pavement",
      rangedAttackModifier: 0,
      coverArmorLevel: null,
      visibilityHexes:
        "unlimited",
      blocking: false,
    },
    field: {
      type: "field",
      rangedAttackModifier: 0,
      coverArmorLevel: null,
      visibilityHexes:
        "unlimited",
      blocking: false,
    },
    shrubland: {
      type: "shrubland",
      rangedAttackModifier: -1,
      coverArmorLevel: null,
      visibilityHexes:
        "unlimited",
      blocking: false,
    },
    debris: {
      type: "debris",
      rangedAttackModifier: -1,
      coverArmorLevel: 3,
      visibilityHexes:
        "unlimited",
      blocking: false,
    },
    forest: {
      type: "forest",
      rangedAttackModifier: -1,
      coverArmorLevel: 2,
      visibilityHexes: 3,
      blocking: false,
    },
    foliage: {
      type: "foliage",
      rangedAttackModifier: -2,
      coverArmorLevel: null,
      visibilityHexes: 1,
      blocking: false,
    },
    swamp: {
      type: "swamp",
      rangedAttackModifier: 0,
      coverArmorLevel: null,
      visibilityHexes:
        "unlimited",
      blocking: false,
    },
    shallows: {
      type: "shallows",
      rangedAttackModifier: 0,
      coverArmorLevel: null,
      visibilityHexes:
        "unlimited",
      blocking: false,
    },
    blocking: {
      type: "blocking",
      rangedAttackModifier: null,
      coverArmorLevel: null,
      visibilityHexes: "none",
      blocking: true,
    },
    indoors: {
      type: "indoors",
      rangedAttackModifier: -1,
      coverArmorLevel: 1,
      visibilityHexes: 0,
      blocking: false,
    },
  };

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
