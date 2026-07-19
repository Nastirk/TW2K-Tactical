import { describe, expect, it } from "vitest";
import { SameHexFirearmModifierProvider } from "../../../src/rules/providers/same-hex-firearm-modifier-provider";

describe("SameHexFirearmModifierProvider", () => {
  it("applies -1 to pistols, carbines, and SMGs against an active aware target in the same hex", () => {
    const provider = new SameHexFirearmModifierProvider({
      getWeaponCategory: () => "pistol",
      isTargetActiveAndAware: () => true,
    });

    expect(
      provider.getModifiers({
        attackerId: "a",
        targetId: "t",
        weaponId: "w",
        distanceHexes: 0,
        combatMode: "ranged",
        rangeBand: "short",
        sameHex: true,
      })[0]?.value,
    ).toBe(-1);
  });

  it("applies -2 to other ranged weapons", () => {
    const provider = new SameHexFirearmModifierProvider({
      getWeaponCategory: () => "other",
      isTargetActiveAndAware: () => true,
    });

    expect(
      provider.getModifiers({
        attackerId: "a",
        targetId: "t",
        weaponId: "w",
        distanceHexes: 0,
        combatMode: "ranged",
        rangeBand: "short",
        sameHex: true,
      })[0]?.value,
    ).toBe(-2);
  });

  it("does not apply to a close-combat attack", () => {
    const provider = new SameHexFirearmModifierProvider({
      getWeaponCategory: () => "pistol",
      isTargetActiveAndAware: () => true,
    });

    expect(
      provider.getModifiers({
        attackerId: "a",
        targetId: "t",
        distanceHexes: 0,
        combatMode: "close-combat",
        sameHex: true,
      }),
    ).toEqual([]);
  });
});
