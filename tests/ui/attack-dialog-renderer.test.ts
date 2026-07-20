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
      stablePlatform: false,
    });

    expect(html).toContain('name="aimMode"');
    expect(html).toContain('name="calledShot"');
    expect(html).toContain('name="lightLevel"');
    expect(html).toContain('name="hasBipod"');
    expect(html).toContain('name="bipodDeployed"');
    expect(html).toContain('name="hasTelescopicSight"');
    expect(html).toContain('name="attackerProne" value="true"');
    expect(html).not.toContain('value="slow"');
    expect(html).not.toContain('type="checkbox" name="hasTelescopicSight"');
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
      stablePlatform: false,
    });

    expect(html).toContain('value="slow"');
    expect(html).toContain('Slow telescopic aim');
  });
});
