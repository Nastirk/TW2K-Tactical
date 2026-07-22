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
        name: "Tripod",
      }),
    ).toBe("tripod");

    expect(
      detectWeaponAccessoryKind({
        type: "gear",
        name: "Fatigues",
      }),
    ).toBeUndefined();
  });

  it("lists actor weapons even before the mirrored capability property is checked", () => {
    const checkedWeapon = {
      id: "checked-weapon",
      type: "weapon",
      system: { props: { scope: true } },
    };
    const uncheckedWeapon = {
      id: "unchecked-weapon",
      type: "weapon",
      system: { props: { scope: false } },
    };
    const gear = {
      id: "gear-1",
      type: "gear",
    };

    expect(
      getCompatibleWeapons(
        { items: [checkedWeapon, uncheckedWeapon, gear] },
        "scope",
      ),
    ).toEqual([checkedWeapon, uncheckedWeapon]);
  });

  it("persists the attachment and checks the matching native weapon property", async () => {
    const setFlag = vi.fn().mockResolvedValue(undefined);
    const weaponUpdate = vi.fn().mockResolvedValue(undefined);
    const weapon = {
      id: "weapon-1",
      type: "weapon",
      system: { props: { scope: false } },
      update: weaponUpdate,
    };
    const item = {
      id: "scope-1",
      type: "gear",
      name: "Telescopic Sight (Scope)",
      setFlag,
      parent: {
        items: [] as unknown[],
      },
    };
    item.parent.items = [item, weapon];

    await persistAttachedWeaponId(item, "weapon-1");

    expect(setFlag).toHaveBeenCalledWith(
      "tw2k-tactical",
      "attachedWeaponId",
      "weapon-1",
    );
    expect(weaponUpdate).toHaveBeenCalledWith({
      "system.props.scope": true,
    });
  });

  it("moves the mirrored capability when an accessory is reattached", async () => {
    const oldWeaponUpdate = vi.fn().mockResolvedValue(undefined);
    const newWeaponUpdate = vi.fn().mockResolvedValue(undefined);
    const oldWeapon = {
      id: "weapon-1",
      type: "weapon",
      update: oldWeaponUpdate,
    };
    const newWeapon = {
      id: "weapon-2",
      type: "weapon",
      update: newWeaponUpdate,
    };
    const item = {
      id: "bipod-1",
      type: "gear",
      name: "Bipod",
      flags: {
        "tw2k-tactical": {
          attachedWeaponId: "weapon-1",
        },
      },
      setFlag: vi.fn().mockResolvedValue(undefined),
      parent: {
        items: [] as unknown[],
      },
    };
    item.parent.items = [item, oldWeapon, newWeapon];

    await persistAttachedWeaponId(item, "weapon-2");

    expect(newWeaponUpdate).toHaveBeenCalledWith({
      "system.props.bipod": true,
    });
    expect(oldWeaponUpdate).toHaveBeenCalledWith({
      "system.props.bipod": false,
    });
  });

  it("does not clear a mirrored property while another matching accessory remains attached", async () => {
    const weaponUpdate = vi.fn().mockResolvedValue(undefined);
    const weapon = {
      id: "weapon-1",
      type: "weapon",
      update: weaponUpdate,
    };
    const item = {
      id: "tripod-1",
      type: "gear",
      name: "Tripod",
      flags: {
        "tw2k-tactical": {
          attachedWeaponId: "weapon-1",
        },
      },
      unsetFlag: vi.fn().mockResolvedValue(undefined),
      parent: {
        items: [] as unknown[],
      },
    };
    const otherTripod = {
      id: "tripod-2",
      type: "gear",
      name: "Tripod",
      flags: {
        "tw2k-tactical": {
          attachedWeaponId: "weapon-1",
        },
      },
    };
    item.parent.items = [item, otherTripod, weapon];

    await persistAttachedWeaponId(item, undefined);

    expect(weaponUpdate).not.toHaveBeenCalled();
  });

  it("reads the attached weapon flag", () => {
    expect(
      readAttachedWeaponId({
        flags: {
          "tw2k-tactical": {
            attachedWeaponId: "weapon-1",
          },
        },
      }),
    ).toBe("weapon-1");
  });
});
