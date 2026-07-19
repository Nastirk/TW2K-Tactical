import { describe, expect, it, vi } from "vitest";
import { FoundryLiveAttackController } from "../../../src/foundry/combat/foundry-live-attack-controller";

describe("FoundryLiveAttackController", () => {
  it("warns and stops when there is no valid selection", async () => {
    const warn = vi.fn();
    const collect = vi.fn();
    const execute = vi.fn();

    const controller = new FoundryLiveAttackController(
      { getSelection: () => null },
      { collect },
      { execute },
      { warn },
    );

    await expect(controller.attack()).resolves.toBe(false);
    expect(warn).toHaveBeenCalledOnce();
    expect(collect).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it("stops when the attack dialog is cancelled", async () => {
    const selection = {
      attackerActor: {},
      targetActor: {},
      weapon: {},
    };
    const execute = vi.fn();

    const controller = new FoundryLiveAttackController(
      { getSelection: () => selection },
      { collect: async () => null },
      { execute },
      { warn: vi.fn() },
    );

    await expect(controller.attack()).resolves.toBe(false);
    expect(execute).not.toHaveBeenCalled();
  });

  it("executes a live attack after collecting dialog input", async () => {
    const selection = {
      attackerActor: { id: "attacker" },
      targetActor: { id: "target" },
      weapon: { id: "weapon" },
    };
    const dialogInput = {
      distanceMeters: 25,
      aimed: true,
    };
    const execute = vi.fn().mockResolvedValue(undefined);

    const controller = new FoundryLiveAttackController(
      { getSelection: () => selection },
      { collect: async () => dialogInput },
      { execute },
      { warn: vi.fn() },
    );

    await expect(controller.attack()).resolves.toBe(true);
    expect(execute).toHaveBeenCalledWith({
      selection,
      dialogInput,
    });
  });
});
