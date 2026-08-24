import { describe, expect, it } from "vitest";
import { CORE_RULE_CATALOG } from "../../src/rule-data/core-rule-catalog";
import { MANUAL_SOURCE_INDEX } from "../../src/rule-data/manual-source-index";
import {
  COMBAT_TERRAIN_DATA,
  TRAVEL_RULE_CATALOG,
  TRAVEL_TERRAIN_DATA,
} from "../../src/rule-data/terrain-and-travel";
import { GEAR_DATA, WEAPON_DATA } from "../../src/rule-data/equipment-data";
import {
  CHARACTER_RULE_CATALOG,
  BASE_FACILITY_DATA,
  SCENARIO_SITE_DATA,
  SOLO_SETTLEMENT_TABLE,
  VEHICLE_DATA,
} from "../../src/rule-data/character-base-referee-data";

describe("rule data catalog", () => {
  it("uses stable unique IDs and traceable printed-page sources", () => {
    expect(new Set(CORE_RULE_CATALOG.map((rule) => rule.id)).size).toBe(CORE_RULE_CATALOG.length);
    expect(CORE_RULE_CATALOG.every((rule) => rule.source.page > 0 && rule.summary.length > 0)).toBe(true);
  });

  it("indexes the supplied manuals and distinguishes executable material", () => {
    expect(MANUAL_SOURCE_INDEX.map((section) => section.manual)).toContain("players");
    expect(MANUAL_SOURCE_INDEX.map((section) => section.manual)).toContain("referees");
    expect(MANUAL_SOURCE_INDEX.filter((section) => section.classification === "mechanics").length).toBeGreaterThan(5);
  });

  it("keeps combat and travel terrain as separate, complete rule tables", () => {
    expect(COMBAT_TERRAIN_DATA).toHaveLength(10);
    expect(COMBAT_TERRAIN_DATA.find((terrain) => terrain.id === "forest")).toMatchObject({
      visibilityHexes: 3,
      coverArmorLevel: 2,
      movementModifier: -1,
    });
    expect(TRAVEL_TERRAIN_DATA.find((terrain) => terrain.id === "woods")).toMatchObject({
      offRoadSpeedFactor: 0.5,
      foragingModifier: 1,
    });
    expect(TRAVEL_RULE_CATALOG.some((rule) => rule.id === "travel.off-road-navigation")).toBe(true);
  });

  it("stores weapon-table stats as numeric data with provenance", () => {
    expect(WEAPON_DATA.find((weapon) => weapon.id === "m16a2")).toMatchObject({
      ammunition: "5.56x45",
      rateOfFire: 3,
      damage: 2,
      shortRangeHexes: 6,
      magazineCapacity: 30,
    });
    expect(WEAPON_DATA.find((weapon) => weapon.id === "smoke-grenade")?.traits).toContain("creates-smoke");
    expect(GEAR_DATA.find((item) => item.id === "compass")?.effects).toContainEqual({
      operation: "add",
      target: "travel.navigationModifier",
      value: 2,
    });
  });

  it("models character, vehicle, solo, and scenario content without UI text", () => {
    expect(CHARACTER_RULE_CATALOG.some((rule) => rule.id === "character.hit-capacity")).toBe(true);
    expect(VEHICLE_DATA.find((vehicle) => vehicle.id === "m113a3")).toMatchObject({
      armor: { front: 4, side: 4, rear: 4 }, crew: 2, passengerCapacity: 11,
    });
    expect(SOLO_SETTLEMENT_TABLE).toHaveLength(13);
    expect(BASE_FACILITY_DATA.find((facility) => facility.id === "root-cellar")?.effects).toContainEqual({
      operation: "set", target: "domesticFood.shelfLife", value: "1 month",
    });
    expect(SCENARIO_SITE_DATA.map((site) => site.id)).toEqual([
      "the-prison", "americatown", "childrens-crusade", "the-burnt-town",
    ]);
  });
});
