import {
  describe,
  expect,
  it,
} from "vitest";

import {
  DamageResolver,
} from "../../src/combat/damage-resolver";

describe("DamageResolver", () => {
  const resolver =
    new DamageResolver();

  it(
    "adds one damage per extra success beyond the first",
    () => {
      expect(
        resolver.resolve({
          weaponBaseDamage: 2,
          extraSuccesses: 2,
        }),
      ).toEqual({
        weaponBaseDamage: 2,
        extraSuccesses: 2,
        damageBeforeArmor: 4,
      });
    },
  );

  it(
    "uses base damage when there are no extra successes",
    () => {
      expect(
        resolver.resolve({
          weaponBaseDamage: 3,
        }).damageBeforeArmor,
      ).toBe(3);
    },
  );
});
