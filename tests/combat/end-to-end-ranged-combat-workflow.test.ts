import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ActorStateService,
} from "../../src/combat/actor-state-service";
import type {
  ActorCombatState,
} from "../../src/combat/actor-combat-state";
import type {
  ActorCombatStateRepository,
} from "../../src/combat/actor-combat-state-repository";
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
  EndToEndRangedCombatWorkflow,
} from "../../src/combat/end-to-end-ranged-combat-workflow";
import {
  HitLocationResolver,
} from "../../src/combat/hit-location-resolver";
import {
  PostHitResolver,
} from "../../src/combat/post-hit-resolver";
import {
  RangedAttackResolver,
} from "../../src/combat/ranged-attack-resolver";

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

class MemoryRepository
  implements
    ActorCombatStateRepository
{
  constructor(
    public state:
      ActorCombatState,
  ) {}

  async get():
    Promise<ActorCombatState> {
    return structuredClone(
      this.state,
    );
  }

  async set(
    _actorId: string,
    state:
      ActorCombatState,
  ): Promise<void> {
    this.state =
      structuredClone(state);
  }
}

function createWorkflow(
  diceValues: number[],
  hitLocationRoll: number,
  critRolls: number[],
  repository:
    MemoryRepository,
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

  return new EndToEndRangedCombatWorkflow(
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
    new ActorStateService(
      repository,
    ),
  );
}

describe(
  "EndToEndRangedCombatWorkflow",
  () => {
    it(
      "returns a miss without updating actor state",
      async () => {
        const repository =
          new MemoryRepository({
            damage: 0,
            hitCapacity: 5,
            incapacitated: false,
            criticalInjuries: [],
          });

        const workflow =
          createWorkflow(
            [2, 3],
            3,
            [],
            repository,
          );

        const result =
          await workflow.resolve({
            attackerId: "a",
            targetId: "t",
            targetActorId:
              "target-actor",
            weaponId: "w",
            baseAttributeDie: 8,
            baseSkillDie: 8,
            weaponBaseDamage: 2,
            critThreshold: 3,
            weaponArmorModifier: 0,
          });

        expect(
          result.hit,
        ).toBe(false);

        expect(
          result.targetUpdated,
        ).toBe(false);

        expect(
          repository.state.damage,
        ).toBe(0);
      },
    );

    it(
      "applies damage on a normal hit",
      async () => {
        const repository =
          new MemoryRepository({
            damage: 0,
            hitCapacity: 5,
            incapacitated: false,
            criticalInjuries: [],
          });

        const workflow =
          createWorkflow(
            [6, 2],
            3,
            [],
            repository,
          );

        const result =
          await workflow.resolve({
            attackerId: "a",
            targetId: "t",
            targetActorId:
              "target-actor",
            weaponId: "w",
            baseAttributeDie: 8,
            baseSkillDie: 8,
            weaponBaseDamage: 2,
            critThreshold: 3,
            weaponArmorModifier: 0,
          });

        expect(
          result.hit,
        ).toBe(true);

        expect(
          result.postHit
            ?.finalDamage,
        ).toBe(2);

        expect(
          repository.state.damage,
        ).toBe(2);

        expect(
          repository.state
            .criticalInjuries,
        ).toHaveLength(0);
      },
    );

    it(
      "resolves and stores a lethal critical injury",
      async () => {
        const repository =
          new MemoryRepository({
            damage: 0,
            hitCapacity: 8,
            incapacitated: false,
            criticalInjuries: [],
          });

        const workflow =
          createWorkflow(
            [10, 6],
            6,
            [5, 9],
            repository,
          );

        const result =
          await workflow.resolve({
            attackerId: "a",
            targetId: "t",
            targetActorId:
              "target-actor",
            weaponId: "w",
            baseAttributeDie: 10,
            baseSkillDie: 8,
            weaponBaseDamage: 3,
            critThreshold: 3,
            weaponArmorModifier: 0,
          });

        expect(
          result.hit,
        ).toBe(true);

        expect(
          result.criticalInjury
            ?.injury.injury,
        ).toBe(
          "Crushed windpipe",
        );

        expect(
          repository.state
            .criticalInjuries,
        ).toHaveLength(1);

        expect(
          repository.state
            .deathSaveState
            ?.status,
        ).toBe("required");

        expect(
          repository.state
            .deathSaveState
            ?.timeLimit,
        ).toBe("round");
      },
    );

    it(
      "can incapacitate the target through accumulated damage",
      async () => {
        const repository =
          new MemoryRepository({
            damage: 3,
            hitCapacity: 5,
            incapacitated: false,
            criticalInjuries: [],
          });

        const workflow =
          createWorkflow(
            [6, 2],
            2,
            [],
            repository,
          );

        await workflow.resolve({
          attackerId: "a",
          targetId: "t",
          targetActorId:
            "target-actor",
          weaponId: "w",
          baseAttributeDie: 8,
          baseSkillDie: 8,
          weaponBaseDamage: 2,
          critThreshold: 4,
          weaponArmorModifier: 0,
        });

        expect(
          repository.state.damage,
        ).toBe(5);

        expect(
          repository.state
            .incapacitated,
        ).toBe(true);
      },
    );
  },
);
