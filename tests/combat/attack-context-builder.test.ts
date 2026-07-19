import { describe, expect, it } from "vitest";
import {
  AttackContextBuilder,
  type AttackContextDataSource,
} from "../../src/combat/attack-context-builder";

describe("AttackContextBuilder", () => {
  it("builds a ranged attack context", () => {
    const dataSource: AttackContextDataSource = {
      getDistanceHexes: () => 4,
      getCombatMode: () => "ranged",
      getRangeBand: () => "medium",
    };

    const result = new AttackContextBuilder(dataSource).build({
      attackerId: "attacker-1",
      targetId: "target-1",
      weaponId: "weapon-1",
    });

    expect(result.rangeBand).toBe("medium");
    expect(result.combatMode).toBe("ranged");
  });
});
