import {
  describe,
  expect,
  it,
} from "vitest";

import {
  RangedCombatModifierResolver,
} from "../../src/rules/ranged-combat-modifier-resolver";

describe(
  "RangedCombatModifierResolver",
  () => {
    const resolver =
      new RangedCombatModifierResolver();

    it(
      "applies compact-weapon quick shot penalty",
      () => {
        const result =
          resolver.resolve({
            weaponCategory:
              "pistol",
            aimMode: "quick",
          });

        expect(
          result.netModifier,
        ).toBe(-1);
      },
    );

    it(
      "applies other-weapon quick shot penalty",
      () => {
        const result =
          resolver.resolve({
            weaponCategory:
              "rifle",
            aimMode: "quick",
          });

        expect(
          result.netModifier,
        ).toBe(-2);
      },
    );

    it(
      "gives +1 for slow telescopic aim",
      () => {
        const result =
          resolver.resolve({
            weaponCategory:
              "rifle",
            aimMode: "slow",
            hasTelescopicSight:
              true,
          });

        expect(
          result.netModifier,
        ).toBe(1);

        expect(
          result
            .ammoDiceAllowed,
        ).toBe(false);
      },
    );

    it(
      "gives +2 for slow telescopic aim from a stable platform",
      () => {
        const result =
          resolver.resolve({
            weaponCategory:
              "rifle",
            aimMode: "slow",
            hasTelescopicSight:
              true,
            stablePlatform:
              true,
          });

        expect(
          result.netModifier,
        ).toBe(2);
      },
    );

    it(
      "combines common target and environment modifiers",
      () => {
        const result =
          resolver.resolve({
            weaponCategory:
              "rifle",
            aimMode: "fast",
            targetProne: true,
            calledShot: true,
            targetMoved: true,
            firingFromMovingVehicle:
              true,
            targetSize: "small",
            elevatedPosition:
              true,
            targetTerrainModifier:
              -1,
            lightLevel: "dim",
            weatherModifier: -1,
          });

        expect(
          result.netModifier,
        ).toBe(-10);
      },
    );

    it(
      "does not penalize a prone target in the same hex",
      () => {
        const result =
          resolver.resolve({
            weaponCategory:
              "pistol",
            targetProne: true,
            sameHex: true,
          });

        expect(
          result.modifiers,
        ).toHaveLength(0);
      },
    );

    it(
      "applies full-cover penalty when approximate location is known",
      () => {
        const result =
          resolver.resolve({
            weaponCategory:
              "rifle",
            targetInFullCover:
              true,
            approximateTargetLocationKnown:
              true,
          });

        expect(
          result.netModifier,
        ).toBe(-3);
      },
    );

    it(
      "blocks full-cover attacks when target location is unknown",
      () => {
        const result =
          resolver.resolve({
            weaponCategory:
              "rifle",
            targetInFullCover:
              true,
          });

        expect(
          result.attackAllowed,
        ).toBe(false);
      },
    );

    it(
      "blocks attacks in total darkness without suitable optics",
      () => {
        const result =
          resolver.resolve({
            weaponCategory:
              "rifle",
            lightLevel:
              "total-darkness",
          });

        expect(
          result.attackAllowed,
        ).toBe(false);
      },
    );

    it(
      "night vision negates darkness",
      () => {
        const result =
          resolver.resolve({
            weaponCategory:
              "rifle",
            lightLevel: "dark",
            hasNightVision: true,
          });

        expect(
          result.netModifier,
        ).toBe(0);
      },
    );

    it(
      "thermal optics negate darkness, weather, and smoke",
      () => {
        const result =
          resolver.resolve({
            weaponCategory:
              "rifle",
            lightLevel: "dark",
            weatherModifier: -2,
            denseSmoke: true,
            hasThermalOptics:
              true,
          });

        expect(
          result.attackAllowed,
        ).toBe(true);

        expect(
          result.netModifier,
        ).toBe(0);
      },
    );

    it(
      "applies carried LMG and GPMG penalties",
      () => {
        expect(
          resolver.resolve({
            weaponCategory:
              "lmg",
            machineGunCarried:
              true,
          }).netModifier,
        ).toBe(-2);

        expect(
          resolver.resolve({
            weaponCategory:
              "gpmg",
            machineGunCarried:
              true,
          }).netModifier,
        ).toBe(-3);
      },
    );

    it(
      "blocks a carried HMG",
      () => {
        expect(
          resolver.resolve({
            weaponCategory:
              "hmg",
            machineGunCarried:
              true,
          }).attackAllowed,
        ).toBe(false);
      },
    );

    it(
      "applies one-handed firearm rules",
      () => {
        expect(
          resolver.resolve({
            weaponCategory:
              "pistol",
            oneHanded: true,
          }).netModifier,
        ).toBe(0);

        expect(
          resolver.resolve({
            weaponCategory:
              "smg",
            oneHanded: true,
          }).netModifier,
        ).toBe(-2);

        expect(
          resolver.resolve({
            weaponCategory:
              "rifle",
            oneHanded: true,
            atShortRange: true,
          }).netModifier,
        ).toBe(-3);
      },
    );

    it(
      "blocks one-handed rifle fire beyond short range",
      () => {
        const result =
          resolver.resolve({
            weaponCategory:
              "rifle",
            oneHanded: true,
            atShortRange: false,
          });

        expect(
          result.attackAllowed,
        ).toBe(false);
      },
    );

    it(
      "blocks one-handed machine-gun fire",
      () => {
        const result =
          resolver.resolve({
            weaponCategory:
              "lmg",
            oneHanded: true,
          });

        expect(
          result.attackAllowed,
        ).toBe(false);
      },
    );

    it(
      "automatically applies carried machine-gun penalties when no support is deployed",
      () => {
        expect(
          resolver.resolve({
            weaponCategory:
              "lmg",
            aimMode: "fast",
          }).netModifier,
        ).toBe(-2);

        expect(
          resolver.resolve({
            weaponCategory:
              "gpmg",
            aimMode: "fast",
          }).netModifier,
        ).toBe(-3);
      },
    );

    it(
      "removes carried machine-gun penalties when supported",
      () => {
        expect(
          resolver.resolve({
            weaponCategory:
              "lmg",
            aimMode: "fast",
            bipodDeployed: true,
          }).netModifier,
        ).toBe(0);

        expect(
          resolver.resolve({
            weaponCategory:
              "gpmg",
            aimMode: "fast",
            tripodDeployed: true,
          }).netModifier,
        ).toBe(0);

        expect(
          resolver.resolve({
            weaponCategory:
              "gpmg",
            aimMode: "fast",
            vehicleMounted: true,
          }).netModifier,
        ).toBe(0);
      },
    );

    it(
      "blocks unsupported HMG fire but allows tripod or vehicle mounting",
      () => {
        expect(
          resolver.resolve({
            weaponCategory:
              "hmg",
            aimMode: "fast",
          }).attackAllowed,
        ).toBe(false);

        expect(
          resolver.resolve({
            weaponCategory:
              "hmg",
            aimMode: "fast",
            tripodDeployed: true,
          }).attackAllowed,
        ).toBe(true);

        expect(
          resolver.resolve({
            weaponCategory:
              "hmg",
            aimMode: "fast",
            vehicleMounted: true,
          }).attackAllowed,
        ).toBe(true);
      },
    );

    it(
      "blocks hard LOS and visibility-limit violations",
      () => {
        expect(
          resolver.resolve({
            weaponCategory: "rifle",
            lineOfSightBlocked: true,
          }).attackAllowed,
        ).toBe(false);

        expect(
          resolver.resolve({
            weaponCategory: "rifle",
            distanceHexes: 6,
            visibilityLimitHexes: 5,
          }).attackAllowed,
        ).toBe(false);

        expect(
          resolver.resolve({
            weaponCategory: "rifle",
            distanceHexes: 6,
            visibilityLimitHexes: 5,
            hasThermalOptics: true,
          }).attackAllowed,
        ).toBe(true);
      },
    );

    it(
      "only applies full-cover firing penalties when cover is effective against the attacker",
      () => {
        expect(
          resolver.resolve({
            weaponCategory: "rifle",
            targetInFullCover: true,
            coverEffectiveAgainstAttacker: false,
          }).netModifier,
        ).toBe(0);

        expect(
          resolver.resolve({
            weaponCategory: "rifle",
            targetInFullCover: true,
            coverEffectiveAgainstAttacker: true,
            approximateTargetLocationKnown: true,
          }).netModifier,
        ).toBe(-3);
      },
    );
  },
);
