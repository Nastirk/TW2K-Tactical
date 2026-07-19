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

    expect(callbacks.has("renderItemSheet")).toBe(true);
    expect(callbacks.has("renderItemSheetV2")).toBe(true);

    callbacks.get("renderItemSheetV2")?.({}, {});
    await attackCallback?.();

    expect(launch).toHaveBeenCalledWith(
      actor,
      weapon,
    );
  });
});
