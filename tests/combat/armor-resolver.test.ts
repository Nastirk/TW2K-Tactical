import { describe, expect, it } from "vitest";
import { ArmorResolver } from "../../src/combat/armor-resolver";

describe("ArmorResolver", () => {
  const resolver = new ArmorResolver();

  it("applies armor covering the hit location", () => {
    const result = resolver.resolve({
      location: "torso",
      incomingDamage: 5,
      armor: {
        location: "torso",
        rating: 2,
      },
    });

    expect(result.damageAfterArmor).toBe(3);
  });

  it("does not apply armor covering another location", () => {
    const result = resolver.resolve({
      location: "head",
      incomingDamage: 5,
      armor: {
        location: "torso",
        rating: 2,
      },
    });

    expect(result.damageAfterArmor).toBe(5);
  });

  it("applies armor piercing without negative armor", () => {
    const result = resolver.resolve({
      location: "torso",
      incomingDamage: 5,
      armor: {
        location: "torso",
        rating: 2,
      },
      armorPiercing: 5,
    });

    expect(result.effectiveArmor).toBe(0);
    expect(result.damageAfterArmor).toBe(5);
  });
});
