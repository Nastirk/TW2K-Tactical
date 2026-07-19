import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ArmorResolver,
} from "../../src/combat/armor-resolver";
import {
  AttackContextBuilder,
  type AttackContextDataSource,
} from "../../src/combat/attack-context-builder";
import {
  CriticalInjuryResolver,
} from "../../src/combat/critical-injury-resolver";
import {
  CriticalInjuryRollResolver,
} from "../../src/combat/critical-injury-roll-resolver";
import {
  CriticalInjuryTableResolver,
} from "../../src/combat/critical-injury-table-resolver";
import {
  DamageResolver,
} from "../../src/combat/damage-resolver";
import {
  DeathSaveResolver,
} from "../../src/combat/death-save-resolver";
import {
  DiceModifierApplicator,
} from "../../src/dice/modifier-applicator";
import {
  DiceEngine,
  type DieRoller,
} from "../../src/dice/roller";
import type {
  StepDie,
} from "../../src/dice/types";
import {
  HitLocationResolver,
} from "../../src/combat/hit-location-resolver";
import {
  PostHitResolver,
} from "../../src/combat/post-hit-resolver";
import {
  RangedAttackResolver,
} from "../../src/combat/ranged-attack-resolver";
import {
  StagedEndToEndRangedCombatWorkflow,
} from "../../src/combat/staged-end-to-end-ranged-combat-workflow";

class FixedDieRoller
  implements DieRoller
{
  private index = 0;

  constructor(
    private readonly values:
      number[],
  ) {}

  async rollDie(
    _sides: StepDie,
  ): Promise<number> {
    return this.values[
      this.index++
    ]!;
  }
}

function createWorkflow(
  diceValues: number[],
  hitLocationRoll: number,
  critRolls: number[],
) {
  const dataSource:
    AttackContextDataSource = {
      getDistanceHexes:
        () => 1,
      getCombatMode:
        () => "ranged",
      getRangeBand:
        () => "short",
    };

  const attackResolver =
    new RangedAttackResolver(
      new AttackContextBuilder(
        dataSource,
      ),
      [],
      new DiceModifierApplicator(),
      new DiceEngine(
        new FixedDieRoller(
          diceValues,
        ),
      ),
    );

  const postHitResolver =
    new PostHitResolver(
      new HitLocationResolver({
        rollD6:
          async () =>
            hitLocationRoll,
      }),
      new DamageResolver(),
      new ArmorResolver(),
      new CriticalInjuryResolver(),
    );

  const criticalRollValues =
    [...critRolls];

  return new StagedEndToEndRangedCombatWorkflow(
    attackResolver,
    postHitResolver,
    new CriticalInjuryRollResolver(
      {
        rollD10:
          async () =>
            criticalRollValues.shift()!,
      },
      new CriticalInjuryTableResolver(),
    ),
    new DeathSaveResolver(),
  );
}

describe(
  "StagedEndToEndRangedCombatWorkflow",
  () => {
    it(
      "stages a miss without actor mutation",
      async () => {
        const workflow =
          createWorkflow(
            [2, 3],
            3,
            [],
          );

        const result =
          await workflow.resolve({
            attackerId: "a",
            targetId: "t",
            targetActorId:
              "target",
            weaponId: "w",
            baseAttributeDie: 8,
            baseSkillDie: 8,
            weaponBaseDamage: 2,
            critThreshold: 3,
            weaponArmorModifier: 0,
          });

        expect(result.hit).toBe(
          false,
        );

        expect(
          result.targetUpdated,
        ).toBe(false);
      },
    );

    it(
      "stages damage without actor mutation",
      async () => {
        const workflow =
          createWorkflow(
            [6, 2],
            3,
            [],
          );

        const result =
          await workflow.resolve({
            attackerId: "a",
            targetId: "t",
            targetActorId:
              "target",
            weaponId: "w",
            baseAttributeDie: 8,
            baseSkillDie: 8,
            weaponBaseDamage: 2,
            critThreshold: 3,
            weaponArmorModifier: 0,
          });

        expect(
          result.postHit
            ?.finalDamage,
        ).toBe(2);

        expect(
          result.targetUpdated,
        ).toBe(false);
      },
    );

    it(
      "stages critical injury and death-save state",
      async () => {
        const workflow =
          createWorkflow(
            [10, 6],
            6,
            [5, 9],
          );

        const result =
          await workflow.resolve({
            attackerId: "a",
            targetId: "t",
            targetActorId:
              "target",
            weaponId: "w",
            baseAttributeDie: 10,
            baseSkillDie: 8,
            weaponBaseDamage: 3,
            critThreshold: 3,
            weaponArmorModifier: 0,
          });

        expect(
          result
            .criticalInjury
            ?.injury
            .injury,
        ).toBe(
          "Crushed windpipe",
        );

        expect(
          result
            .deathSaveState
            ?.status,
        ).toBe("required");

        expect(
          result.targetUpdated,
        ).toBe(false);
      },
    );
  },
);
