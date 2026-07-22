import {
  describe,
  expect,
  it,
} from "vitest";
import {
  T2K4EAmmunitionAdapter,
} from "../../../src/foundry/t2k4e/t2k4e-ammunition-adapter";

const weapon = {
  id: "rifle",
  name: "M16A2",
  type: "weapon",
  system: {
    rof: 3,
    ammo: "5.56x45mm",
    mag: {
      target: "loaded",
      max: 30,
    },
  },
};

describe("T2K4EAmmunitionAdapter", () => {
  it("reads the official T2K4E weapon and loaded-ammunition schema", () => {
    const result =
      new T2K4EAmmunitionAdapter()
        .getWeaponAmmoState(
          {
            id: "actor",
            type: "character",
            items: [{
              id: "loaded",
              name: "5.56x45mm Magazine",
              type: "gear",
              system: {
                itemType: "ammunition",
                ammo: {
                  value: 17,
                  max: 30,
                },
              },
            }],
          },
          weapon,
        );

    expect(result).toEqual({
      ammunitionItemId: "loaded",
      rateOfFire: 3,
      roundsRemaining: 17,
      magazineCapacity: 30,
      caliber: "5.56x45mm",
    });
  });

  it("leaves weapons without the complete recognized schema untracked", () => {
    const result =
      new T2K4EAmmunitionAdapter()
        .getWeaponAmmoState(
          {
            id: "actor",
            type: "character",
            items: [],
          },
          {
            ...weapon,
            system: {
              ammo: "5.56x45mm",
            },
          },
        );

    expect(result).toBeUndefined();
  });

  it("returns only non-empty caliber/capacity-compatible reload candidates", () => {
    const adapter =
      new T2K4EAmmunitionAdapter();
    const candidates =
      adapter.getReloadCandidates(
        {
          id: "actor",
          type: "character",
          items: [
            {
              id: "loaded",
              name: "5.56x45mm Loaded",
              type: "gear",
              system: {
                itemType: "ammunition",
                ammo: { value: 10, max: 30 },
              },
            },
            {
              id: "good",
              name: "5.56x45mm Magazine",
              type: "gear",
              system: {
                itemType: "ammunition",
                ammo: { value: 30, max: 30 },
              },
            },
            {
              id: "safe-name-fallback",
              name: "5.56x45mm Magazine",
              type: "gear",
              system: {
                ammo: { value: 12, max: 30 },
              },
            },
            {
              id: "empty",
              name: "5.56x45mm Magazine",
              type: "gear",
              system: {
                itemType: "ammunition",
                ammo: { value: 0, max: 30 },
              },
            },
            {
              id: "wrong-caliber",
              name: "7.62x51mm Magazine",
              type: "gear",
              system: {
                itemType: "ammunition",
                ammo: { value: 20, max: 30 },
              },
            },
            {
              id: "wrong-capacity",
              name: "5.56x45mm Magazine",
              type: "gear",
              system: {
                itemType: "ammunition",
                ammo: { value: 20, max: 20 },
              },
            },
          ],
        },
        weapon,
      );

    expect(
      candidates.map(
        (candidate) =>
          candidate.ammunitionItemId,
      ),
    ).toEqual([
      "good",
      "safe-name-fallback",
    ]);
  });
});
