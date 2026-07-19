import { describe, expect, it } from "vitest";
import { FoundryAttackDialogInitialFactory } from "../../../src/foundry/runtime/foundry-attack-dialog-initial-factory";
import { FoundryWeaponCategoryResolver } from "../../../src/foundry/runtime/foundry-runtime-adapters";

describe("FoundryAttackDialogInitialFactory", () => {
  it("creates safe defaults and infers the weapon category", () => {
    const factory = new FoundryAttackDialogInitialFactory(
      () => undefined,
      new FoundryWeaponCategoryResolver(),
    );

    const result = factory.create({
      attackerActor: { id: "a" },
      targetActor: { id: "t" },
      weapon: {
        id: "w",
        type: "weapon",
        name: "Service Pistol",
        system: {
          damage: 2,
          crit: 3,
          armorModifier: 0,
          range: 2,
        },
      },
    });

    expect(result.weaponCategory).toBe("pistol");
    expect(result.aimMode).toBe("fast");
    expect(result.targetTerrainModifier).toBe(0);
    expect(result.weatherModifier).toBe(0);
  });
});
