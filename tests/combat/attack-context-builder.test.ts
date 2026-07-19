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

    expect(result).toEqual({
      attackerId: "attacker-1",
      targetId: "target-1",
      weaponId: "weapon-1",
      distanceHexes: 4,
      combatMode: "ranged",
      rangeBand: "medium",
      sameHex: false,
    });
  });

  it("builds a same-hex ranged firearm context", () => {
    const dataSource: AttackContextDataSource = {
      getDistanceHexes: () => 0,
      getCombatMode: () => "ranged",
      getRangeBand: () => "short",
    };

    const result = new AttackContextBuilder(dataSource).build({
      attackerId: "attacker-1",
      targetId: "target-1",
      weaponId: "pistol-1",
    });

    expect(result.sameHex).toBe(true);
    expect(result.combatMode).toBe("ranged");
    expect(result.rangeBand).toBe("short");
  });

  it("builds a close-combat context without a range band", () => {
    const dataSource: AttackContextDataSource = {
      getDistanceHexes: () => 0,
      getCombatMode: () => "close-combat",
      getRangeBand: () => "short",
    };

    const result = new AttackContextBuilder(dataSource).build({
      attackerId: "attacker-1",
      targetId: "target-1",
    });

    expect(result).toEqual({
      attackerId: "attacker-1",
      targetId: "target-1",
      weaponId: undefined,
      distanceHexes: 0,
      combatMode: "close-combat",
      rangeBand: undefined,
      sameHex: true,
    });
  });
});
