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
    ]);

    const result = new AttackDialogParser().parse(
      {
        get: (name) => values.get(name),
      },
      "rifle",
    );

    expect(result.aimMode).toBe("slow");
    expect(result.calledShot).toBe(true);
    expect(result.targetSize).toBe("small");
    expect(result.targetTerrainModifier).toBe(-1);
    expect(result.lightLevel).toBe("dark");
    expect(result.weatherModifier).toBe(-1);
    expect(result.hasTelescopicSight).toBe(true);
  });
});
