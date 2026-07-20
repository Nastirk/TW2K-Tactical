import {
  describe,
  expect,
  it,
} from "vitest";
import {
  ElevationModifierProvider,
} from "../../../src/rules/providers/elevation-modifier-provider";

const base = {
  attackerId: "a",
  targetId: "t",
  weaponId: "w",
  distanceHexes: 2,
  combatMode: "ranged" as const,
  rangeBand: "short" as const,
  sameHex: false,
};

describe(
  "ElevationModifierProvider",
  () => {
    it(
      "applies +1 when the attacker has an elevated firing position",
      () => {
        const provider =
          new ElevationModifierProvider();

        expect(
          provider.getModifiers({
            ...base,
            elevatedPosition: true,
          }),
        ).toEqual([
          {
            source: "elevation",
            value: 1,
            description:
              "Elevated firing position",
          },
        ]);
      },
    );

    it(
      "does not apply without an elevated firing position",
      () => {
        const provider =
          new ElevationModifierProvider();

        expect(
          provider.getModifiers({
            ...base,
            elevatedPosition: false,
          }),
        ).toEqual([]);
      },
    );
  },
);
