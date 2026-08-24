import { describe, expect, it } from "vitest";
import { TRAVEL_MAP_CATALOG, type TravelHexMetadata } from "../../src/maps/travel-map-catalog";

describe("travel map catalog", () => {
  it("references the installed Core Set Poland Travel Map at the printed travel scale", () => {
    expect(TRAVEL_MAP_CATALOG).toEqual([
      expect.objectContaining({
        id: "t2k4e-coreset-poland",
        hexKilometres: 10,
        source: { manual: "players", page: 138, section: "Travel Maps" },
        asset: {
          moduleId: "t2k4e-coreset",
          assetPath: "modules/t2k4e-coreset/assets/scenes/Poland Travel Map.webp",
        },
      }),
    ]);
  });

  it("keeps travel hex metadata geographic and independent of encounter maps", () => {
    const hex: TravelHexMetadata = {
      id: "poland-q0-r0",
      coordinates: { q: 0, r: 0 },
      terrain: "woods",
      features: ["road", "river"],
    };

    expect(hex).not.toHaveProperty("battleMap");
    expect(hex.features).toEqual(["road", "river"]);
  });
});
