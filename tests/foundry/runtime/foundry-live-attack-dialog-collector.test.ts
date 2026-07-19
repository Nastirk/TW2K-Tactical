import { describe, expect, it, vi } from "vitest";
import { FoundryLiveAttackDialogCollector } from "../../../src/foundry/runtime/foundry-live-attack-dialog-collector";

describe("FoundryLiveAttackDialogCollector", () => {
  it("resolves the modifier-aware attack request submitted by the dialog", async () => {
    const attack = {
      combat: { attackerId: "a" },
      modifiers: { weaponCategory: "pistol" },
    };

    const dialogService = {
      open: vi.fn((request: { onSubmit: (value: unknown) => void }) => {
        request.onSubmit(attack);
      }),
    };

    const collector = new FoundryLiveAttackDialogCollector(
      dialogService as never,
      {
        createRangedAttack: vi.fn(() => ({ attackerId: "a" })),
      } as never,
      {
        create: vi.fn(() => ({ weaponCategory: "pistol" })),
      } as never,
    );

    await expect(
      collector.collect({
        attackerActor: {},
        targetActor: {},
        weapon: {},
      }),
    ).resolves.toEqual({ attack });
  });
});
