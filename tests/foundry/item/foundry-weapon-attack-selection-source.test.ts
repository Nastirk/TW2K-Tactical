import { describe, expect, it } from "vitest";
import { FoundryWeaponAttackSelectionSource } from "../../../src/foundry/item/foundry-weapon-attack-selection-source";

describe("FoundryWeaponAttackSelectionSource", () => {
  it("combines the pending weapon attack with the current target", () => {
    const target = { id: "target" };

    const source = new FoundryWeaponAttackSelectionSource({
      getTargetActor: () => target,
    });

    const attacker = { id: "attacker" };
    const weapon = { id: "weapon" };

    source.begin(attacker, weapon);

    expect(source.getSelection()).toEqual({
      attackerActor: attacker,
      targetActor: target,
      weapon,
    });

    source.clear();
    expect(source.getSelection()).toBeNull();
  });

  it("returns null when no target is selected", () => {
    const source = new FoundryWeaponAttackSelectionSource({
      getTargetActor: () => null,
    });

    source.begin({}, {});
    expect(source.getSelection()).toBeNull();
  });
});
