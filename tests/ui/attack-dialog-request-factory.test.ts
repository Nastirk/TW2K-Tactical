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
        targetProne: false,
        targetInFullCover: false,
        approximateTargetLocationKnown: false,
        targetMoved: true,
        firingFromMovingVehicle: false,
        targetSize: "normal",
        elevatedPosition: false,
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
        stablePlatform: false,
      },
    );

    expect(request.modifiers.aimMode).toBe("quick");
    expect(request.modifiers.calledShot).toBe(true);
    expect(request.modifiers.targetMoved).toBe(true);
  });
});
