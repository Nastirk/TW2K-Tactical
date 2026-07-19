import {
  describe,
  expect,
  it,
} from "vitest";

import {
  T2K4EWeaponAdapter,
} from "../../../src/foundry/t2k4e/t2k4e-weapon-adapter";

describe(
  "T2K4EWeaponAdapter",
  () => {
    it(
      "extracts a ranged weapon profile",
      () => {
        const profile =
          new T2K4EWeaponAdapter({
            id: "akm",
            type: "weapon",
            system: {
              damage: 2,
              crit: 3,
              armorModifier: -1,
              range: 4,
            },
          }).toProfile();

        expect(profile).toEqual({
          weaponId: "akm",
          baseDamage: 2,
          critThreshold: 3,
          armorModifier: -1,
          shortRangeHexes: 4,
        });
      },
    );
  },
);
