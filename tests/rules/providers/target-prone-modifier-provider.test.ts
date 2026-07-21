import {
  describe,
  expect,
  it,
} from "vitest";
import {
  TargetProneModifierProvider,
} from "../../../src/rules/providers/target-prone-modifier-provider";

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
  "TargetProneModifierProvider",
  () => {
    it(
      "applies -1 to a prone ranged target outside the same hex",
      () => {
        const provider =
          new TargetProneModifierProvider();

        expect(
          provider.getModifiers({
            ...base,
            targetProne: true,
          }),
        ).toEqual([
          {
            source:
              "target-prone",
            value: -1,
            description:
              "Target prone",
            provenance: "automatic",
          },
        ]);
      },
    );

    it(
      "does not apply in the same hex or when the target is not prone",
      () => {
        const provider =
          new TargetProneModifierProvider();

        expect(
          provider.getModifiers({
            ...base,
            targetProne: true,
            sameHex: true,
          }),
        ).toEqual([]);

        expect(
          provider.getModifiers({
            ...base,
            targetProne: false,
          }),
        ).toEqual([]);
      },
    );
  },
);
