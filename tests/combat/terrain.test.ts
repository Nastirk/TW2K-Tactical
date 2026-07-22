import {
  describe,
  expect,
  it,
} from "vitest";
import {
  getTerrainProfile,
  parseTerrainType,
} from "../../src/combat/terrain";

describe(
  "T2K4E terrain profiles",
  () => {
    it(
      "maps terrain to ranged attack, cover, visibility, and blocking facts",
      () => {
        expect(
          getTerrainProfile(
            "forest",
          ),
        ).toEqual({
          type: "forest",
          rangedAttackModifier: -1,
          coverArmorLevel: 2,
          visibilityHexes: 3,
          blocking: false,
        });

        expect(
          getTerrainProfile(
            "foliage",
          ).rangedAttackModifier,
        ).toBe(-2);

        expect(
          getTerrainProfile(
            "blocking",
          ),
        ).toEqual({
          type: "blocking",
          rangedAttackModifier: null,
          coverArmorLevel: null,
          visibilityHexes: "none",
          blocking: true,
        });
      },
    );

    it(
      "parses supported structured terrain tags",
      () => {
        expect(
          parseTerrainType(
            "Shrub Land",
          ),
        ).toBe(
          "shrubland",
        );

        expect(
          parseTerrainType(
            "INDOORS",
          ),
        ).toBe(
          "indoors",
        );

        expect(
          parseTerrainType(
            "unknown",
          ),
        ).toBeUndefined();
      },
    );
  },
);
