import { describe, expect, it, vi } from "vitest";
import { FoundryWeaponAttackAction } from "../../../src/foundry/item/foundry-weapon-attack-action";

describe("FoundryWeaponAttackAction", () => {
  it("sets and clears the weapon selection around a live attack", async () => {
    const begin = vi.fn();
    const clear = vi.fn();
    const attack = vi.fn().mockResolvedValue(true);

    const action = new FoundryWeaponAttackAction(
      { begin, clear } as never,
      { attack } as never,
    );

    const attacker = { id: "attacker" };
    const weapon = { id: "weapon" };

    await expect(
      action.launch(attacker, weapon),
    ).resolves.toBe(true);

    expect(begin).toHaveBeenCalledWith(
      attacker,
      weapon,
    );
    expect(attack).toHaveBeenCalledOnce();
    expect(clear).toHaveBeenCalledOnce();
  });

  it("clears the selection when the attack fails", async () => {
    const clear = vi.fn();

    const action = new FoundryWeaponAttackAction(
      {
        begin: vi.fn(),
        clear,
      } as never,
      {
        attack: vi.fn().mockRejectedValue(
          new Error("boom"),
        ),
      } as never,
    );

    await expect(
      action.launch({}, {}),
    ).rejects.toThrow("boom");

    expect(clear).toHaveBeenCalledOnce();
  });
});
