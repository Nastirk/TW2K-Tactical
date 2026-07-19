import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ArmorResolver,
} from "../../src/combat/armor-resolver";

describe("ArmorResolver", () => {
  const resolver =
    new ArmorResolver();

  it(
    "uses only the highest body-armor layer",
    () => {
      const result =
        resolver.resolve({
          weaponBaseDamage: 4,
          incomingDamage: 5,
          weaponArmorModifier: 0,
          bodyArmorLevels: [
            1,
            3,
            2,
          ],
        });

      expect(
        result.bodyArmorLevel,
      ).toBe(3);

      expect(
        result.damageAfterArmor,
      ).toBe(2);
    },
  );

  it(
    "combines body armor with external armor",
    () => {
      const result =
        resolver.resolve({
          weaponBaseDamage: 5,
          incomingDamage: 6,
          weaponArmorModifier: 0,
          bodyArmorLevels: [2],
          externalArmorLevel: 2,
        });

      expect(
        result.combinedArmorLevel,
      ).toBe(4);

      expect(
        result.damageAfterArmor,
      ).toBe(2);
    },
  );

  it(
    "applies the weapon armor modifier before reducing damage",
    () => {
      const result =
        resolver.resolve({
          weaponBaseDamage: 4,
          incomingDamage: 5,
          weaponArmorModifier: -1,
          bodyArmorLevels: [3],
        });

      expect(
        result.modifiedArmorLevel,
      ).toBe(2);

      expect(
        result.damageAfterArmor,
      ).toBe(3);
    },
  );

  it(
    "does not apply the armor modifier when there is no armor",
    () => {
      const result =
        resolver.resolve({
          weaponBaseDamage: 2,
          incomingDamage: 3,
          weaponArmorModifier: 3,
        });

      expect(
        result.modifiedArmorLevel,
      ).toBe(0);

      expect(
        result.damageAfterArmor,
      ).toBe(3);
    },
  );

  it(
    "fully deflects when modified armor exceeds base damage by two or more",
    () => {
      const result =
        resolver.resolve({
          weaponBaseDamage: 2,
          incomingDamage: 8,
          weaponArmorModifier: 0,
          bodyArmorLevels: [4],
        });

      expect(
        result
          .fullyDeflectedByPenetrationLimit,
      ).toBe(true);

      expect(
        result.damageAfterArmor,
      ).toBe(0);
    },
  );

  it(
    "requires an ablation check when protected armor is penetrated",
    () => {
      const result =
        resolver.resolve({
          weaponBaseDamage: 4,
          incomingDamage: 5,
          weaponArmorModifier: 0,
          bodyArmorLevels: [2],
        });

      expect(
        result.penetrated,
      ).toBe(true);

      expect(
        result.ablationCheckRequired,
      ).toBe(true);
    },
  );
});
