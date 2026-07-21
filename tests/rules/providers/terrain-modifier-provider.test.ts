import {
  describe,
  expect,
  it,
} from "vitest";
import type {
  AttackContext,
} from "../../../src/combat/attack-context";
import {
  TerrainModifierProvider,
} from "../../../src/rules/providers/terrain-modifier-provider";

function createContext(
  overrides:
    Partial<AttackContext> = {},
): AttackContext {
  return {
    attackerId: "a",
    targetId: "t",
    weaponId: "w",
    distanceHexes: 3,
    combatMode: "ranged",
    rangeBand: "short",
    sameHex: false,
    ...overrides,
  };
}

describe(
  "TerrainModifierProvider",
  () => {
    const provider =
      new TerrainModifierProvider();

    it(
      "applies the target hex terrain penalty",
      () => {
        expect(
          provider.getModifiers(
            createContext({
              targetTerrain:
                "forest",
              targetTerrainModifier:
                -1,
            }),
          ),
        ).toEqual([
          {
            source:
              "target-terrain",
            value: -1,
            description:
              "Target terrain: forest",
            provenance: "automatic",
          },
        ]);
      },
    );

    it(
      "supports the foliage penalty",
      () => {
        expect(
          provider.getModifiers(
            createContext({
              targetTerrain:
                "foliage",
              targetTerrainModifier:
                -2,
            }),
          )[0]?.value,
        ).toBe(-2);
      },
    );

    it(
      "does not apply target terrain when the shooter is in the same hex",
      () => {
        expect(
          provider.getModifiers(
            createContext({
              sameHex: true,
              distanceHexes: 0,
              targetTerrain:
                "forest",
              targetTerrainModifier:
                -1,
            }),
          ),
        ).toEqual([]);
      },
    );

    it(
      "does not add a modifier for neutral or unknown terrain",
      () => {
        expect(
          provider.getModifiers(
            createContext(),
          ),
        ).toEqual([]);

        expect(
          provider.getModifiers(
            createContext({
              targetTerrain:
                "field",
              targetTerrainModifier:
                0,
            }),
          ),
        ).toEqual([]);
      },
    );
  },
);
