import { describe, expect, it } from "vitest";
import {
  FoundryAttackContextDataSource,
  type FoundryAttackContextSource,
} from "../../../src/foundry/combat/foundry-attack-context-data-source";

describe("FoundryAttackContextDataSource", () => {
  it("delegates distance, range band, and combat mode", () => {
    const source: FoundryAttackContextSource = {
      getTokenDistanceHexes: () => 5,
      getWeaponRangeBand: () => "medium",
      isCloseCombatAttack: () => false,
      getTargetTerrain: () => "forest",
    };

    const dataSource = new FoundryAttackContextDataSource(source);
    const request = {
      attackerId: "attacker-1",
      targetId: "target-1",
      weaponId: "weapon-1",
    };

    expect(
      dataSource.getDistanceHexes("attacker-1", "target-1"),
    ).toBe(5);
    expect(dataSource.getCombatMode(request, 5)).toBe("ranged");
    expect(dataSource.getRangeBand("weapon-1", 5)).toBe("medium");
    expect(dataSource.getTargetTerrain("target-1")).toBe("forest");
  });

  it("returns close-combat when the source identifies a close-combat attack", () => {
    const source: FoundryAttackContextSource = {
      getTokenDistanceHexes: () => 0,
      getWeaponRangeBand: () => "short",
      isCloseCombatAttack: () => true,
    };

    const dataSource = new FoundryAttackContextDataSource(source);

    expect(
      dataSource.getCombatMode(
        {
          attackerId: "attacker-1",
          targetId: "target-1",
        },
        0,
      ),
    ).toBe("close-combat");
  });
});
