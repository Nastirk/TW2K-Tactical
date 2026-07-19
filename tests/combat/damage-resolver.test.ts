import { describe, expect, it } from "vitest";
import { ArmorResolver } from "../../src/combat/armor-resolver";
import { DamageResolver } from "../../src/combat/damage-resolver";
import { HitLocationResolver } from "../../src/combat/hit-location-resolver";

describe("DamageResolver", () => {
  it("resolves location, bonus damage, armor, and final damage", async () => {
    const hitLocation = new HitLocationResolver(
      { roll: async () => 1 },
      { resolve: () => "torso" },
    );

    const resolver = new DamageResolver(
      hitLocation,
      new ArmorResolver(),
    );

    const result = await resolver.resolve({
      baseDamage: 3,
      extraSuccesses: 2,
      damagePerExtraSuccess: 1,
      armor: {
        location: "torso",
        rating: 2,
      },
    });

    expect(result.location).toBe("torso");
    expect(result.damageBeforeArmor).toBe(5);
    expect(result.finalDamage).toBe(3);
  });

  it("rejects invalid base damage", async () => {
    const resolver = new DamageResolver(
      new HitLocationResolver(
        { roll: async () => 1 },
        { resolve: () => "torso" },
      ),
      new ArmorResolver(),
    );

    await expect(
      resolver.resolve({
        baseDamage: -1,
      }),
    ).rejects.toThrow(
      "Base damage must be a non-negative integer.",
    );
  });
});
