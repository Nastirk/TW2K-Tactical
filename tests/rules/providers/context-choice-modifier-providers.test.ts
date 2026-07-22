import { describe, expect, it } from "vitest";
import { CalledShotModifierProvider } from "../../../src/rules/providers/called-shot-modifier-provider";
import { HelperModifierProvider } from "../../../src/rules/providers/helper-modifier-provider";
import { MovingVehicleModifierProvider } from "../../../src/rules/providers/moving-vehicle-modifier-provider";
import { TargetMovementModifierProvider } from "../../../src/rules/providers/target-movement-modifier-provider";

const base = {
  attackerId: "a",
  targetId: "t",
  weaponId: "w",
  distanceHexes: 2,
  combatMode: "ranged" as const,
  rangeBand: "short" as const,
  sameHex: false,
};

describe("context choice modifier providers", () => {
  it("applies called shot, target movement, and moving-vehicle modifiers", () => {
    expect(new CalledShotModifierProvider().getModifiers({ ...base, calledShot: true })[0]?.value).toBe(-2);
    expect(new TargetMovementModifierProvider().getModifiers({ ...base, targetMoved: true })[0]?.value).toBe(-1);
    expect(new MovingVehicleModifierProvider().getModifiers({ ...base, firingFromMovingVehicle: true })[0]?.value).toBe(-2);
  });

  it("caps help at +3", () => {
    expect(new HelperModifierProvider().getModifiers({ ...base, helperCount: 7 })[0]?.value).toBe(3);
  });
});
