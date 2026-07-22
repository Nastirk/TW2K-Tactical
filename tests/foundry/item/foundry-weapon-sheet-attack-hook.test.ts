import { describe, expect, it, vi } from "vitest";
import { registerFoundryWeaponSheetAttackHook } from "../../../src/foundry/item/foundry-weapon-sheet-attack-hook";

describe("registerFoundryWeaponSheetAttackHook", () => {
  it("registers legacy and ApplicationV2 weapon-sheet hooks", async () => {
    const callbacks = new Map<
      string,
      (application: unknown, html: unknown) => unknown
    >();

    const hooks = {
      on: vi.fn(
        (
          name: string,
          callback: (
            application: unknown,
            html: unknown,
          ) => unknown,
        ) => {
          callbacks.set(name, callback);
        },
      ),
    };

    let attackCallback:
      | (() => void | Promise<void>)
      | undefined;
    let reloadCallback:
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
        addReloadAction: (
          callback: () => void | Promise<void>,
        ) => {
          reloadCallback = callback;
        },
      })),
    };

    const launch =
      vi.fn().mockResolvedValue(true);
    const reload =
      vi.fn().mockResolvedValue(true);

    registerFoundryWeaponSheetAttackHook(
      hooks,
      adapter,
      { launch } as never,
      { launch: reload } as never,
    );

    expect(callbacks.has("renderItemSheet")).toBe(true);
    expect(callbacks.has("renderItemSheetV2")).toBe(true);

    callbacks.get("renderItemSheetV2")?.({}, {});
    await attackCallback?.();
    await reloadCallback?.();

    expect(launch).toHaveBeenCalledWith(
      actor,
      weapon,
    );
    expect(reload).toHaveBeenCalledWith(
      actor,
      weapon,
    );
  });
});
