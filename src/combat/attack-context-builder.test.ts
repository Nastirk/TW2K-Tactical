import { describe, expect, it } from "vitest";
import {
  AttackContextBuilder,
  type AttackContextDataSource,
} from "../../src/combat/attack-context-builder";

describe("AttackContextBuilder", () => {
  it("builds an attack context from a request", () => {
    const dataSource: AttackContextDataSource = {
      getDistance: () => 42,
      getRangeBand: () => "medium",
    };

    const builder = new AttackContextBuilder(dataSource);

    const result = builder.build({
      attackerId: "attacker-1",
      targetId: "target-1",
      weaponId: "weapon-1",
    });

    expect(result).toEqual({
      attackerId: "attacker-1",
      targetId: "target-1",
      weaponId: "weapon-1",
      distance: 42,
      rangeBand: "medium",
    });
  });
});