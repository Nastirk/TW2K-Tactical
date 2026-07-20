import { describe, expect, it, vi } from "vitest";
import { FoundryLiveAttackDialogCollector } from "../../../src/foundry/runtime/foundry-live-attack-dialog-collector";

describe("FoundryLiveAttackDialogCollector", () => {
  it("validates the live selection before building the attack request", async () => {
    const attack = {
      combat: { attackerId: "a" },
      modifiers: { weaponCategory: "pistol" },
    };

    const selection = {
      attackerActor: {
      id: "a",
      system: {
        attributes: {
          agl: { value: 10 },
          str: { value: 12 },
        },
        skills: {
          rangedCombat: { value: 8 },
          heavyWeapons: { value: 6 },
        },
      },
    },
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
        attackerActor: {
      id: "a",
      system: {
        attributes: {
          agl: { value: 10 },
          str: { value: 12 },
        },
        skills: {
          rangedCombat: { value: 8 },
          heavyWeapons: { value: 6 },
        },
      },
    },
        targetActor: {},
        weapon: {},
      }),
    ).resolves.toEqual({ attack });
  });

  it("pre-resolves a random hit location before selecting T2K4E armor", async () => {
    const attack = {
      combat: { attackerId: "a" },
      modifiers: { weaponCategory: "pistol" },
    };

    const selection = {
      attackerActor: {
      id: "a",
      system: {
        attributes: {
          agl: { value: 10 },
          str: { value: 12 },
        },
        skills: {
          rangedCombat: { value: 8 },
          heavyWeapons: { value: 6 },
        },
      },
    },
      targetActor: { id: "t" },
      weapon: { id: "w", type: "weapon" },
    };

    const createRangedAttack = vi.fn(() => ({
      attackerId: "a",
      chosenHitLocation: "torso",
      bodyArmorLevels: [2],
    }));

    const dialogService = {
      open: vi.fn((request: { onSubmit: (value: unknown) => void }) => {
        request.onSubmit(attack);
      }),
    };

    const hitLocationResolver = {
      resolve: vi.fn(async () => "torso"),
    };

    const collector = new FoundryLiveAttackDialogCollector(
      dialogService as never,
      { createRangedAttack } as never,
      {
        create: vi.fn(() => ({ weaponCategory: "pistol" })),
      } as never,
      undefined,
      hitLocationResolver as never,
    );

    await expect(
      collector.collect(selection),
    ).resolves.toEqual({ attack });

    expect(hitLocationResolver.resolve).toHaveBeenCalledTimes(1);
    expect(createRangedAttack).toHaveBeenCalledWith({
      attacker: selection.attackerActor,
      target: selection.targetActor,
      weapon: selection.weapon,
      chosenHitLocation: "torso",
    });
  });


  it("switches machine-gun attacks to Heavy Weapons with the correct attribute", async () => {
    const attack = {
      combat: {
        attackerId: "a",
        baseAttributeDie: 10,
        baseSkillDie: 8,
      },
      modifiers: {
        weaponCategory: "gpmg",
        tripodDeployed: true,
      },
    };

    const attackerActor = {
      id: "a",
      system: {
        attributes: {
          str: { value: 12 },
          agl: { value: 10 },
        },
        skills: {
          rangedCombat: { value: 8 },
          heavyWeapons: { value: 6 },
        },
      },
    };

    const dialogService = {
      open: vi.fn((request: { onSubmit: (value: unknown) => void }) => {
        request.onSubmit(attack);
      }),
    };

    const collector = new FoundryLiveAttackDialogCollector(
      dialogService as never,
      {
        createRangedAttack: vi.fn(() => ({
          attackerId: "a",
        })),
      } as never,
      {
        create: vi.fn(() => ({
          weaponCategory: "gpmg",
        })),
      } as never,
    );

    const result =
      await collector.collect({
        attackerActor,
        targetActor: {},
        weapon: {},
      });

    expect(
      result?.attack.combat
        .baseAttributeDie,
    ).toBe(10);
    expect(
      result?.attack.combat
        .baseSkillDie,
    ).toBe(6);
  });


});
