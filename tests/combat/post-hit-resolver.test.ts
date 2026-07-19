import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ArmorResolver,
} from "../../src/combat/armor-resolver";
import {
  CriticalInjuryResolver,
} from "../../src/combat/critical-injury-resolver";
import {
  DamageResolver,
} from "../../src/combat/damage-resolver";
import {
  HitLocationResolver,
} from "../../src/combat/hit-location-resolver";
import {
  PostHitResolver,
} from "../../src/combat/post-hit-resolver";

describe("PostHitResolver", () => {
  it(
    "resolves location, damage, armor, and critical injury",
    async () => {
      const resolver =
        new PostHitResolver(
          new HitLocationResolver({
            rollD6: async () => 3,
          }),
          new DamageResolver(),
          new ArmorResolver(),
          new CriticalInjuryResolver(),
        );

      const result =
        await resolver.resolve({
          weaponBaseDamage: 3,
          extraSuccesses: 2,
          critThreshold: 3,
          weaponArmorModifier: -1,
          bodyArmorLevels: [2],
        });

      expect(
        result.location,
      ).toBe("torso");

      expect(
        result.damage.damageBeforeArmor,
      ).toBe(5);

      expect(
        result.armor.modifiedArmorLevel,
      ).toBe(1);

      expect(
        result.finalDamage,
      ).toBe(4);

      expect(
        result.criticalInjury.triggered,
      ).toBe(true);

      expect(
        result.criticalInjury.d10Count,
      ).toBe(1);
    },
  );

  it(
    "supports called shots without rolling hit location",
    async () => {
      const resolver =
        new PostHitResolver(
          new HitLocationResolver({
            rollD6: async () => 1,
          }),
          new DamageResolver(),
          new ArmorResolver(),
          new CriticalInjuryResolver(),
        );

      const result =
        await resolver.resolve({
          weaponBaseDamage: 2,
          critThreshold: 3,
          weaponArmorModifier: 0,
          chosenHitLocation: "head",
        });

      expect(
        result.location,
      ).toBe("head");
    },
  );

  it(
    "prevents critical injury when armor fully deflects the attack",
    async () => {
      const resolver =
        new PostHitResolver(
          new HitLocationResolver({
            rollD6: async () => 2,
          }),
          new DamageResolver(),
          new ArmorResolver(),
          new CriticalInjuryResolver(),
        );

      const result =
        await resolver.resolve({
          weaponBaseDamage: 2,
          extraSuccesses: 5,
          critThreshold: 2,
          weaponArmorModifier: 0,
          bodyArmorLevels: [4],
        });

      expect(
        result.finalDamage,
      ).toBe(0);

      expect(
        result.criticalInjury.triggered,
      ).toBe(false);
    },
  );
});
