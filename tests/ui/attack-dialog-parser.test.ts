import { describe, expect, it } from "vitest";
import { AttackDialogParser } from "../../src/ui/attack-dialog-parser";

describe("AttackDialogParser", () => {
  it("parses dialog values", () => {
    const values = new Map<string, string | boolean>([
      ["aimMode", "slow"],
      ["calledShot", "on"],
      ["targetSize", "small"],
      ["targetTerrainModifier", "-1"],
      ["lightLevel", "dark"],
      ["weatherModifier", "-1"],
      ["hasTelescopicSight", "on"],
      ["attackerProne", "true"],
      ["hasBipod", "true"],
      ["bipodDeployed", "on"],
      ["hasTripod", "true"],
      ["tripodDeployed", "on"],
      ["vehicleMounted", "true"],
      ["ammoDice", "2"],
      [
        "ammoSuccessAllocation",
        "additional-hits",
      ],
    ]);

    const result = new AttackDialogParser().parse(
      {
        get: (name) => values.get(name),
      },
      "rifle",
      {
        ammoTracked: true,
        maxAmmoDice: 3,
        roundsRemaining: 12,
      },
    );

    expect(result.aimMode).toBe("slow");
    expect(result.calledShot).toBe(true);
    expect(result.targetSize).toBe("small");
    expect(result.targetTerrainModifier).toBe(-1);
    expect(result.lightLevel).toBe("dark");
    expect(result.weatherModifier).toBe(-1);
    expect(result.hasTelescopicSight).toBe(true);
    expect(result.attackerProne).toBe(true);
    expect(result.hasBipod).toBe(true);
    expect(result.bipodDeployed).toBe(true);
    expect(result.hasTripod).toBe(true);
    expect(result.tripodDeployed).toBe(true);
    expect(result.vehicleMounted).toBe(true);
    expect(result.ammoTracked).toBe(true);
    expect(result.ammoDice).toBe(2);
    expect(result.maxAmmoDice).toBe(3);
    expect(result.roundsRemaining).toBe(12);
    expect(result.ammoSuccessAllocation).toBe(
      "additional-hits",
    );
  });
});
