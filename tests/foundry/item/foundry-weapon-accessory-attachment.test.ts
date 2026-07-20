import { describe, expect, it, vi } from "vitest";
import {
  detectWeaponAccessoryKind,
  getCompatibleWeapons,
  persistAttachedWeaponId,
  readAttachedWeaponId,
} from "../../../src/foundry/item/foundry-weapon-accessory-attachment";

describe("Foundry weapon accessory attachment", () => {
  it("detects supported accessory kinds", () => {
    expect(
      detectWeaponAccessoryKind({
        type: "gear",
        name: "Telescopic Sight (Scope)",
      }),
    ).toBe("scope");

    expect(
      detectWeaponAccessoryKind({
        type: "gear",
        name: "Bipod",
      }),
    ).toBe("bipod");

    expect(
      detectWeaponAccessoryKind({
        type: "gear",
        name: "Fatigues",
      }),
    ).toBeUndefined();
  });

  it("lists only weapons compatible with the accessory kind", () => {
    const scopeWeapon = {
      id: "scope-weapon",
      type: "weapon",
      system: { props: { scope: true } },
    };
    const plainWeapon = {
      id: "plain-weapon",
      type: "weapon",
      system: { props: { scope: false } },
    };

    expect(
      getCompatibleWeapons(
        { items: [scopeWeapon, plainWeapon] },
        "scope",
      ),
    ).toEqual([scopeWeapon]);
  });

  it("reads and persists the attached weapon flag", async () => {
    const setFlag = vi.fn().mockResolvedValue(undefined);
    const unsetFlag = vi.fn().mockResolvedValue(undefined);
    const item = {
      flags: {
        "tw2k-tactical": {
          attachedWeaponId: "weapon-1",
        },
      },
      setFlag,
      unsetFlag,
    };

    expect(readAttachedWeaponId(item)).toBe("weapon-1");

    await persistAttachedWeaponId(item, "weapon-2");
    expect(setFlag).toHaveBeenCalledWith(
      "tw2k-tactical",
      "attachedWeaponId",
      "weapon-2",
    );

    await persistAttachedWeaponId(item, undefined);
    expect(unsetFlag).toHaveBeenCalledWith(
      "tw2k-tactical",
      "attachedWeaponId",
    );
  });
});
