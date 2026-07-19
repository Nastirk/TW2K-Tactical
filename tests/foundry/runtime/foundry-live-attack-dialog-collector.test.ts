import { describe, expect, it, vi } from "vitest";
import { FoundryLiveAttackDialogCollector } from "../../../src/foundry/runtime/foundry-live-attack-dialog-collector";

describe("FoundryLiveAttackDialogCollector", () => {
  it("validates the live selection before building the attack request", async () => {
    const attack = {
      combat: { attackerId: "a" },
      modifiers: { weaponCategory: "pistol" },
    };

    const selection = {
      attackerActor: { id: "a" },
      targetActor: { id: "t" },
      weapon: { id: "w", type: "weapon" },
    };

    const assertAttackSelection = vi.fn();

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
      { assertAttackSelection },
    );

    await expect(
      collector.collect(selection),
    ).resolves.toEqual({ attack });

    expect(assertAttackSelection).toHaveBeenCalledWith(selection);
  });

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
