/**
 * Official-map references are kept separate from generated or world-specific
 * map data.  The module references installed publisher assets; it does not
 * redistribute them.
 */
export interface OfficialMapAssetReference {
  /** Foundry package that supplies the licensed asset. */
  moduleId: string;
  /** Foundry data-relative asset path, not an absolute local filesystem path. */
  assetPath: string;
}

export interface TravelMapDefinition {
  id: string;
  name: string;
  source: {
    manual: "players";
    page: number;
    section: string;
  };
  asset: OfficialMapAssetReference;
  /** Official travel-map scale; movement rules are resolved per this hex. */
  hexKilometres: number;
}

export type TravelHexTerrain =
  | "road"
  | "open"
  | "woods"
  | "hills"
  | "mountains"
  | "lake-river"
  | "swamp"
  | "ruins";

/**
 * World-specific data to attach to a travel hex after its terrain and
 * features have been transcribed from an official Travel Map.  It deliberately
 * has no tactical-map link: a GM starts an encounter before one is selected.
 */
export interface TravelHexMetadata {
  id: string;
  coordinates: { q: number; r: number };
  terrain: TravelHexTerrain;
  features: readonly (
    | "road"
    | "river"
    | "bridge"
    | "settlement"
    | "railway"
    | "landmark"
  )[];
}

/** Initial supported official Travel Map. */
export const TRAVEL_MAP_CATALOG: readonly TravelMapDefinition[] = [
  {
    id: "t2k4e-coreset-poland",
    name: "Poland Travel Map",
    source: { manual: "players", page: 138, section: "Travel Maps" },
    asset: {
      moduleId: "t2k4e-coreset",
      assetPath: "modules/t2k4e-coreset/assets/scenes/Poland Travel Map.webp",
    },
    hexKilometres: 10,
  },
];
