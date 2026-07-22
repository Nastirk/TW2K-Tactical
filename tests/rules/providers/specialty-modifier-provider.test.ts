import { describe, expect, it } from "vitest";
import { SpecialtyModifierProvider } from "../../../src/rules/providers/specialty-modifier-provider";

function context(category: string) {
  return {
    attackerId: "a",
    targetId: "t",
    weaponId: "w",
    distanceHexes: 2,
    combatMode: "ranged" as const,
    rangeBand: "short" as const,
    sameHex: false,
    category,
  };
}

describe("SpecialtyModifierProvider", () => {
  it("applies Rifleman to assault rifles, carbines, SMGs, and shotguns", () => {
    for (const category of ["assault-rifle", "carbine", "smg", "shotgun"] as const) {
      const provider = new SpecialtyModifierProvider({
        getWeaponCategory: () => category,
        hasAttackerSpecialty: (_id, name) => name === "Rifleman",
      });
      expect(provider.getModifiers(context(category))).toEqual([
        expect.objectContaining({ value: 1, description: "Rifleman specialty" }),
      ]);
    }
  });

  it("applies Machinegunner to machine guns and does not require the specialty to attack", () => {
    const withSpecialty = new SpecialtyModifierProvider({
      getWeaponCategory: () => "gpmg",
      hasAttackerSpecialty: (_id, name) => name === "Machinegunner",
    });
    const withoutSpecialty = new SpecialtyModifierProvider({
      getWeaponCategory: () => "gpmg",
      hasAttackerSpecialty: () => false,
    });

    expect(withSpecialty.getModifiers(context("gpmg"))).toHaveLength(1);
    expect(withoutSpecialty.getModifiers(context("gpmg"))).toHaveLength(0);
  });

  it("maps Sidearms and Sniper only to their applicable categories", () => {
    const sidearms = new SpecialtyModifierProvider({
      getWeaponCategory: () => "pistol",
      hasAttackerSpecialty: (_id, name) => name === "Sidearms",
    });
    const sniper = new SpecialtyModifierProvider({
      getWeaponCategory: () => "sniper-rifle",
      hasAttackerSpecialty: (_id, name) => name === "Sniper",
    });

    expect(sidearms.getModifiers(context("pistol"))[0]?.value).toBe(1);
    expect(sniper.getModifiers(context("sniper-rifle"))[0]?.value).toBe(1);
  });
});
