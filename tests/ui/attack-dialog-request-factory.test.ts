import { describe, expect, it } from "vitest";
import { AttackDialogRequestFactory } from "../../src/ui/attack-dialog-request-factory";

describe("AttackDialogRequestFactory", () => {
  it("creates a modifier-aware staged request", () => {
    const request = new AttackDialogRequestFactory().create(
      {
        attackerId: "a",
        targetId: "t",
        targetActorId: "target",
        weaponId: "w",
        baseAttributeDie: 10,
        baseSkillDie: 8,
        weaponBaseDamage: 2,
        critThreshold: 3,
        weaponArmorModifier: 0,
      },
      {
        weaponCategory: "rifle",
        aimMode: "quick",
        calledShot: true,
        targetProne: true,
        targetInFullCover: false,
        approximateTargetLocationKnown: false,
        targetMoved: true,
        firingFromMovingVehicle: false,
        targetSize: "small",
        elevatedPosition: true,
        targetTerrainModifier: -1,
        lightLevel: "dim",
        weatherModifier: 0,
        denseSmoke: false,
        hasNightVision: false,
        hasThermalOptics: false,
        machineGunCarried: false,
        oneHanded: false,
        atShortRange: true,
        hasTelescopicSight: false,
        attackerProne: true,
        hasBipod: true,
        bipodDeployed: true,
        stablePlatform: false,
      },
    );

    expect(request.modifiers.aimMode).toBe("quick");
    expect(request.modifiers.calledShot).toBe(true);
    expect(request.modifiers.targetMoved).toBe(true);

    expect(
      request.combat.contextOverrides,
    ).toEqual({
      aimMode: "quick",
      hasTelescopicSight: false,
      bipodDeployed: true,
      stablePlatform: undefined,
      targetProne: true,
      targetSize: "small",
      elevatedPosition: true,
      targetTerrainModifier: -1,
    });

    expect(
      request.modifiers.targetProne,
    ).toBe(false);
    expect(
      request.modifiers.targetSize,
    ).toBe("normal");
    expect(
      request.modifiers.elevatedPosition,
    ).toBe(false);
    expect(
      request.modifiers.targetTerrainModifier,
    ).toBe(0);
    expect(
      request.modifiers.stablePlatform,
    ).toBe(true);
  });

  it("uses automatic attacker prone state as a stable platform without setting the manual override", () => {
    const request = new AttackDialogRequestFactory().create(
      {
        attackerId: "a",
        targetId: "t",
        targetActorId: "target",
        weaponId: "w",
        baseAttributeDie: 10,
        baseSkillDie: 8,
        weaponBaseDamage: 2,
        critThreshold: 3,
        weaponArmorModifier: 0,
      },
      {
        weaponCategory: "rifle",
        aimMode: "slow",
        calledShot: false,
        targetProne: false,
        targetInFullCover: false,
        approximateTargetLocationKnown: false,
        targetMoved: false,
        firingFromMovingVehicle: false,
        targetSize: "normal",
        elevatedPosition: false,
        targetTerrainModifier: 0,
        lightLevel: "normal",
        weatherModifier: 0,
        denseSmoke: false,
        hasNightVision: false,
        hasThermalOptics: false,
        machineGunCarried: false,
        oneHanded: false,
        atShortRange: false,
        hasTelescopicSight: true,
        attackerProne: true,
        hasBipod: false,
        bipodDeployed: false,
        stablePlatform: false,
      },
    );

    expect(request.modifiers.stablePlatform).toBe(true);
    expect(request.combat.contextOverrides?.stablePlatform).toBeUndefined();
  });

});
