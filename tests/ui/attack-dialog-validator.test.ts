import { describe, expect, it } from "vitest";
import { AttackDialogValidator } from "../../src/ui/attack-dialog-validator";

const base = {
  weaponCategory: "rifle" as const,
  aimMode: "fast" as const,
  calledShot: false,
  targetProne: false,
  targetInFullCover: false,
  approximateTargetLocationKnown: false,
  targetMoved: false,
  firingFromMovingVehicle: false,
  targetSize: "normal" as const,
  elevatedPosition: false,
  targetTerrainModifier: 0,
  lightLevel: "normal" as const,
  weatherModifier: 0,
  denseSmoke: false,
  hasNightVision: false,
  hasThermalOptics: false,
  machineGunCarried: false,
  oneHanded: false,
  atShortRange: true,
  hasTelescopicSight: false,
  hasBipod: false,
  bipodDeployed: false,
  hasTripod: false,
  tripodDeployed: false,
  vehicleMounted: false,
  stablePlatform: false,
};

describe("AttackDialogValidator", () => {
  it("accepts valid input", () => {
    expect(() =>
      new AttackDialogValidator().validate(base),
    ).not.toThrow();
  });

  it("requires a telescopic sight for slow aim", () => {
    expect(() =>
      new AttackDialogValidator().validate({
        ...base,
        aimMode: "slow",
      }),
    ).toThrow("Slow aim requires a telescopic sight.");
  });

  it("rejects invalid terrain modifiers", () => {
    expect(() =>
      new AttackDialogValidator().validate({
        ...base,
        targetTerrainModifier: -3,
      }),
    ).toThrow("targetTerrainModifier must be 0, -1, or -2.");
  });

  it("requires attached support gear before deployment", () => {
    expect(() =>
      new AttackDialogValidator().validate({
        ...base,
        bipodDeployed: true,
      }),
    ).toThrow(
      "Bipod deployment requires an equipped bipod attached to the selected weapon.",
    );

    expect(() =>
      new AttackDialogValidator().validate({
        ...base,
        tripodDeployed: true,
      }),
    ).toThrow(
      "Tripod deployment requires an equipped tripod attached to the selected weapon.",
    );
  });


});
