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
    expect(html).toContain('name="ammoDice"');
    expect(html).toContain('max="3"');
    expect(html).toContain(
      'name="ammoSuccessAllocation"',
    );
  });
});
