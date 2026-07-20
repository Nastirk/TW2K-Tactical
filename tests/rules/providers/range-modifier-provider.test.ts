import { describe, expect, it } from "vitest";
import { RangeModifierProvider } from "../../../src/rules/providers/range-modifier-provider";

describe("RangeModifierProvider", () => {
  it("returns official ranged modifiers", () => {
    const provider = new RangeModifierProvider();
    const base = {
      attackerId: "a",
      targetId: "t",
      weaponId: "w",
      distanceHexes: 1,
      combatMode: "ranged" as const,
      sameHex: false,
    };

    expect(provider.getModifiers({ ...base, rangeBand: "short" })[0]?.value).toBe(0);
    expect(provider.getModifiers({ ...base, rangeBand: "medium" })[0]?.value).toBe(-1);
    expect(provider.getModifiers({ ...base, rangeBand: "long" })[0]?.value).toBe(-2);
    expect(provider.getModifiers({ ...base, rangeBand: "extreme" })[0]?.value).toBe(-3);
  });
  it("removes range-to-hit penalties for shotguns and explains damage falloff", () => {
    const provider = new RangeModifierProvider();
    const base = {
      attackerId: "a",
      targetId: "t",
      weaponId: "shotgun",
      distanceHexes: 3,
      combatMode: "ranged" as const,
      sameHex: false,
      usesShotgunRangeRules: true,
    };

    expect(
      provider.getModifiers({
        ...base,
        rangeBand: "medium",
      }),
    ).toEqual([
      {
        source: "range",
        value: 0,
        description:
          "Shotgun range: medium (no hit penalty; base damage -1)",
      },
    ]);

    expect(
      provider.getModifiers({
        ...base,
        rangeBand: "extreme",
      })[0]?.value,
    ).toBe(0);
  });

});
