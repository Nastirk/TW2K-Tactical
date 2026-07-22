import { describe, expect, it } from "vitest";
import { AttackDialogRenderer } from "../../src/ui/attack-dialog-renderer";

describe("AttackDialogRenderer", () => {
  it("renders attack controls", () => {
    const html = new AttackDialogRenderer().render({
      weaponCategory: "rifle",
      aimMode: "fast",
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
      atShortRange: true,
      hasTelescopicSight: false,
      attackerProne: true,
      hasBipod: true,
      bipodDeployed: false,
      hasTripod: false,
      tripodDeployed: false,
      vehicleMounted: false,
      stablePlatform: false,
      ammoTracked: true,
      ammoDice: 1,
      maxAmmoDice: 3,
      roundsRemaining: 12,
      ammoSuccessAllocation: "damage",
    });

    expect(html).toContain('name="aimMode"');
    expect(html).toContain('name="calledShot"');
    expect(html).toContain('name="lightLevel"');
    expect(html).toContain('name="hasBipod"');
    expect(html).toContain('name="bipodDeployed"');
    expect(html).toContain('name="hasTripod"');
    expect(html).toContain('name="vehicleMounted"');
    expect(html).toContain('name="hasTelescopicSight"');
    expect(html).not.toContain("Machine gun fired while carried");
    expect(html).not.toContain(">At short range<");
    expect(html).toContain('name="attackerProne" value="true"');
    expect(html).not.toContain('value="slow"');
    expect(html).not.toContain('type="checkbox" name="hasTelescopicSight"');
    expect(html).toContain('name="visibilityLimitHexes"');
    expect(html).toContain('name="ammoDice"');
    expect(html).toContain('max="3"');
    expect(html).toContain(
      'name="ammoSuccessAllocation"',
    );
  });

  it("only exposes slow telescopic aim when the selected weapon has an equipped scope", () => {
    const html = new AttackDialogRenderer().render({
      weaponCategory: "rifle",
      aimMode: "quick",
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
      atShortRange: true,
      hasTelescopicSight: true,
      hasBipod: false,
      bipodDeployed: false,
      hasTripod: false,
      tripodDeployed: false,
      vehicleMounted: false,
      stablePlatform: false,
    });

    expect(html).toContain('value="slow"');
    expect(html).toContain('Slow telescopic aim');
  });

  it("shows tripod deployment only for an attached compatible tripod", () => {
    const html = new AttackDialogRenderer().render({
      weaponCategory: "gpmg",
      aimMode: "fast",
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
      machineGunCarried: true,
      oneHanded: false,
      atShortRange: true,
      hasTelescopicSight: false,
      hasBipod: false,
      bipodDeployed: false,
      hasTripod: true,
      tripodDeployed: false,
      vehicleMounted: false,
      stablePlatform: false,
    });

    expect(html).toContain('name="tripodDeployed"');
    expect(html).toContain("Tripod deployed");
    expect(html).not.toContain("One-handed shooting");
  });

});
