import { describe, expect, it, vi } from "vitest";
import { FoundryModifierAwareLiveAttackExecutor } from "../../../src/foundry/runtime/foundry-live-attack-executor";

describe("FoundryModifierAwareLiveAttackExecutor", () => {
  it("injects runtime range facts and publishes through the staged service", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);

    const executor = new FoundryModifierAwareLiveAttackExecutor({
      create: () => ({
        service: { execute },
        sameHex: true,
        atShortRange: true,
      }),
    });

    await executor.execute({
      selection: {
        attackerActor: { name: "Attacker" },
        targetActor: { name: "Target" },
        weapon: { name: "Weapon" },
      },
      dialogInput: {
        attack: {
          combat: {
            attackerId: "a",
            targetId: "t",
            targetActorId: "t",
            weaponId: "w",
            weaponBaseDamage: 2,
            critThreshold: 3,
            weaponArmorModifier: 0,
          },
          modifiers: {
            weaponCategory: "pistol",
          },
        },
      },
    });

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        attack: expect.objectContaining({
          modifiers: expect.objectContaining({
            sameHex: true,
            atShortRange: true,
          }),
        }),
      }),
    );
  });
});
