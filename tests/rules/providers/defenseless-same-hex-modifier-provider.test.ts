import { describe, expect, it } from "vitest";
import { DefenselessSameHexModifierProvider } from "../../../src/rules/providers/defenseless-same-hex-modifier-provider";

const base = {
  attackerId: "a",
  targetId: "t",
  weaponId: "w",
  distanceHexes: 0,
  combatMode: "ranged" as const,
  rangeBand: "short" as const,
  sameHex: true,
};

describe("DefenselessSameHexModifierProvider", () => {
  it("grants +3 against a defenseless target in the same hex", () => {
    expect(
      new DefenselessSameHexModifierProvider().getModifiers({
        ...base,
        targetDefenseless: true,
      }),
    ).toEqual([
      expect.objectContaining({ value: 3 }),
    ]);
  });

  it("does not apply outside the same hex", () => {
    expect(
      new DefenselessSameHexModifierProvider().getModifiers({
        ...base,
        sameHex: false,
        distanceHexes: 1,
        targetDefenseless: true,
      }),
    ).toHaveLength(0);
  });
});
