import { describe, expect, it, vi } from "vitest";
import { registerFoundryWeaponSheetAttackHook } from "../../../src/foundry/item/foundry-weapon-sheet-attack-hook";

describe("registerFoundryWeaponSheetAttackHook", () => {
  it("registers and delegates a weapon-sheet attack action", async () => {
    let renderHook:
      | ((application: unknown, html: unknown) => unknown)
      | undefined;

    const hooks = {
      on: vi.fn(
        (
          name: string,
          callback: (
            application: unknown,
            html: unknown,
          ) => unknown,
        ) => {
          expect(name).toBe("renderItemSheet");
          renderHook = callback;
        },
      ),
    };

    let attackCallback:
      | (() => void | Promise<void>)
      | undefined;

    const actor = { id: "actor" };
    const weapon = { id: "weapon" };

    const adapter = {
      resolve: vi.fn(() => ({
        attackerActor: actor,
        weapon,
        addAttackAction: (
          callback: () => void | Promise<void>,
        ) => {
          attackCallback = callback;
        },
      })),
    };

    const launch =
      vi.fn().mockResolvedValue(true);

    registerFoundryWeaponSheetAttackHook(
      hooks,
      adapter,
      { launch } as never,
    );

    renderHook?.({}, {});
    await attackCallback?.();

    expect(launch).toHaveBeenCalledWith(
      actor,
      weapon,
    );
  });
});
