import {
  describe,
  expect,
  it,
} from "vitest";

import {
  AttackContextBuilder,
  type AttackContextDataSource,
} from "../../src/combat/attack-context-builder";

import {
  RangedAttackResolver,
  type RangedAttackModifierProvider,
} from "../../src/combat/ranged-attack-resolver";

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

class FixedRoller implements DieRoller {
  private index = 0;

  constructor(
    private readonly values: number[],
  ) {}

  async rollDie(
    _sides: StepDie,
  ): Promise<number> {
    return this.values[this.index++]!;
  }
}

describe(
  "RangedAttackResolver",
  () => {
    it(
      "builds context, applies modifiers, rolls final dice, and returns a structured result",
      async () => {
        const dataSource:
          AttackContextDataSource = {
            getDistanceHexes: () => 4,
            getCombatMode: () => "ranged",
            getRangeBand: () => "medium",
          };

        const contextBuilder =
          new AttackContextBuilder(
            dataSource,
          );

        const provider:
          RangedAttackModifierProvider = {
            getModifiers: () => [
              {
                source: "range",
                value: -1,
                description: "Range: medium",
              },
            ],
          };

        const resolver =
          new RangedAttackResolver(
            contextBuilder,
            [provider],
            new DiceModifierApplicator(),
            new DiceEngine(
              new FixedRoller([
                6,
                8,
              ]),
            ),
          );

        const result =
          await resolver.resolve({
            attackerId: "attacker-1",
            targetId: "target-1",
            weaponId: "weapon-1",
            baseAttributeDie: 10,
            baseSkillDie: 8,
          });

        expect(
          result.context.rangeBand,
        ).toBe("medium");

        expect(
          result.basePool.dice,
        ).toEqual([
          10,
          8,
        ]);

        expect(
          result.modifiers,
        ).toEqual([
          {
            source: "range",
            value: -1,
            description: "Range: medium",
          },
        ]);

        expect(
          result.netModifier,
        ).toBe(-1);

        expect(
          result.finalPool.dice,
        ).toEqual([
          8,
          8,
        ]);

        expect(
          result.roll.rolls,
        ).toEqual([
          {
            sides: 8,
            value: 6,
          },
          {
            sides: 8,
            value: 8,
          },
        ]);

        expect(
          result.roll.successes,
        ).toBe(2);
      },
    );

    it(
      "combines multiple modifier providers",
      async () => {
        const dataSource:
          AttackContextDataSource = {
            getDistanceHexes: () => 0,
            getCombatMode: () => "ranged",
            getRangeBand: () => "short",
          };

        const resolver =
          new RangedAttackResolver(
            new AttackContextBuilder(
              dataSource,
            ),
            [
              {
                getModifiers: () => [
                  {
                    source: "range",
                    value: 0,
                    description: "Range: short",
                  },
                ],
              },
              {
                getModifiers: () => [
                  {
                    source:
                      "same-hex-firearm",
                    value: -1,
                    description:
                      "Same hex",
                  },
                ],
              },
            ],
            new DiceModifierApplicator(),
            new DiceEngine(
              new FixedRoller([
                6,
                7,
              ]),
            ),
          );

        const result =
          await resolver.resolve({
            attackerId: "a",
            targetId: "t",
            weaponId: "w",
            baseAttributeDie: 10,
            baseSkillDie: 8,
          });

        expect(
          result.netModifier,
        ).toBe(-1);

        expect(
          result.finalPool.dice,
        ).toEqual([
          8,
          8,
        ]);
      },
    );

    it(
      "rejects close-combat contexts",
      async () => {
        const dataSource:
          AttackContextDataSource = {
            getDistanceHexes: () => 0,
            getCombatMode: () =>
              "close-combat",
            getRangeBand: () => "short",
          };

        const resolver =
          new RangedAttackResolver(
            new AttackContextBuilder(
              dataSource,
            ),
            [],
            new DiceModifierApplicator(),
            new DiceEngine(
              new FixedRoller([]),
            ),
          );

        await expect(
          resolver.resolve({
            attackerId: "a",
            targetId: "t",
            weaponId: "w",
            baseAttributeDie: 8,
            baseSkillDie: 8,
          }),
        ).rejects.toThrow(
          "RangedAttackResolver can only resolve ranged attacks.",
        );
      },
    );

    it(
      "rejects targets beyond effective range",
      async () => {
        const dataSource:
          AttackContextDataSource = {
            getDistanceHexes: () => 99,
            getCombatMode: () => "ranged",
            getRangeBand: () =>
              "out-of-range",
          };

        const resolver =
          new RangedAttackResolver(
            new AttackContextBuilder(
              dataSource,
            ),
            [],
            new DiceModifierApplicator(),
            new DiceEngine(
              new FixedRoller([]),
            ),
          );

        await expect(
          resolver.resolve({
            attackerId: "a",
            targetId: "t",
            weaponId: "w",
            baseAttributeDie: 8,
            baseSkillDie: 8,
          }),
        ).rejects.toThrow(
          "Target is beyond the weapon's effective range.",
        );
      },
    );
  },
);
