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
  AttackBlockedError,
  ModifierAwareStagedRangedCombatWorkflow,
} from "../../src/combat/modifier-aware-staged-ranged-combat-workflow";
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
  HitLocationResolver,
} from "../../src/combat/hit-location-resolver";
import {
  PostHitResolver,
} from "../../src/combat/post-hit-resolver";
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
  RangedCombatModifierResolver,
} from "../../src/rules/ranged-combat-modifier-resolver";

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
  rolls: number[],
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

  return new ModifierAwareStagedRangedCombatWorkflow(
    new AttackContextBuilder(
      dataSource,
    ),
    [],
    new DiceModifierApplicator(),
    new DiceEngine(
      new FixedDieRoller(
        rolls,
      ),
    ),
    new PostHitResolver(
      new HitLocationResolver({
        rollD6:
          async () => 3,
      }),
      new DamageResolver(),
      new ArmorResolver(),
      new CriticalInjuryResolver(),
    ),
    new CriticalInjuryRollResolver(
      {
        rollD10:
          async () => 1,
      },
      new CriticalInjuryTableResolver(),
    ),
    new DeathSaveResolver(),
    new RangedCombatModifierResolver(),
  );
}

describe(
  "ModifierAwareStagedRangedCombatWorkflow",
  () => {
    it(
      "injects additional modifiers into the actual attack resolution",
      async () => {
        const workflow =
          createWorkflow([
            5,
            5,
          ]);

        const result =
          await workflow.resolve({
            combat: {
              attackerId: "a",
              targetId: "t",
              targetActorId:
                "target",
              weaponId: "w",
              baseAttributeDie:
                10,
              baseSkillDie: 8,
              weaponBaseDamage:
                2,
              critThreshold: 3,
              weaponArmorModifier:
                0,
            },
            modifiers: {
              weaponCategory:
                "rifle",
              calledShot: true,
            },
          });

        expect(
          result
            .modifierResolution
            .netModifier,
        ).toBe(-2);

        expect(
          result.combat
            .attack
            .modifiers
            .some(
              (modifier) =>
                modifier.source ===
                "called-shot",
            ),
        ).toBe(true);
      },
    );

    it(
      "blocks impossible attacks before dice are rolled",
      async () => {
        const workflow =
          createWorkflow([]);

        await expect(
          workflow.resolve({
            combat: {
              attackerId: "a",
              targetId: "t",
              targetActorId:
                "target",
              weaponId: "w",
              baseAttributeDie:
                8,
              baseSkillDie: 8,
              weaponBaseDamage:
                2,
              critThreshold: 3,
              weaponArmorModifier:
                0,
            },
            modifiers: {
              weaponCategory:
                "rifle",
              lightLevel:
                "total-darkness",
            },
          }),
        ).rejects.toBeInstanceOf(
          AttackBlockedError,
        );
      },
    );

    it(
      "enforces the slow-aim ammo-dice restriction in the core workflow",
      async () => {
        const workflow =
          createWorkflow([]);

        await expect(
          workflow.resolve({
            combat: {
              attackerId: "a",
              targetId: "t",
              targetActorId: "target",
              weaponId: "w",
              baseAttributeDie: 8,
              baseSkillDie: 8,
              weaponBaseDamage: 2,
              critThreshold: 3,
              weaponArmorModifier: 0,
              ammunition: {
                ammunitionItemId: "mag",
                rateOfFire: 3,
                roundsBefore: 20,
                ammoDice: 1,
                allocation: "damage",
                slowAim: false,
              },
            },
            modifiers: {
              weaponCategory: "rifle",
              aimMode: "slow",
              hasTelescopicSight: true,
            },
          }),
        ).rejects.toThrow(
          "Slow telescopic aim does not allow ammo dice",
        );
      },
    );
  },
);
