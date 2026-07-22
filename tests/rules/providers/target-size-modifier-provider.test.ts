import {
  describe,
  expect,
  it,
} from "vitest";
import {
  TargetSizeModifierProvider,
} from "../../../src/rules/providers/target-size-modifier-provider";

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
  "TargetSizeModifierProvider",
  () => {
    it(
      "applies +2 to large targets and -2 to small targets",
      () => {
        const provider =
          new TargetSizeModifierProvider();

        expect(
          provider.getModifiers({
            ...base,
            targetSize: "large",
          })[0]?.value,
        ).toBe(2);

        expect(
          provider.getModifiers({
            ...base,
            targetSize: "small",
          })[0]?.value,
        ).toBe(-2);
      },
    );

    it(
      "does not apply to a normal-sized target",
      () => {
        const provider =
          new TargetSizeModifierProvider();

        expect(
          provider.getModifiers({
            ...base,
            targetSize: "normal",
          }),
        ).toEqual([]);
      },
    );
  },
);
