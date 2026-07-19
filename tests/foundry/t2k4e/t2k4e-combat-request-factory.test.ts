import {
  describe,
  expect,
  it,
} from "vitest";

import {
  T2K4ECombatRequestFactory,
} from "../../../src/foundry/t2k4e/t2k4e-combat-request-factory";

describe(
  "T2K4ECombatRequestFactory",
  () => {
    it(
      "builds an end-to-end ranged combat request from actor and weapon documents",
      () => {
        const factory =
          new T2K4ECombatRequestFactory();

        const request =
          factory.createRangedAttack({
            attacker: {
              id: "attacker",
              type: "character",
              system: {
                attributes: {
                  agl: {
                    value: "A",
                  },
                },
                skills: {
                  rangedCombat: {
                    value: "B",
                  },
                },
              },
            },

            target: {
              id: "target",
              type: "character",
              items: [
                {
                  id: "vest",
                  type: "armor",
                  system: {
                    equipped: true,
                    armor: 2,
                    locations: [
                      "torso",
                    ],
                  },
                },
              ],
            },

            weapon: {
              id: "rifle",
              type: "weapon",
              system: {
                damage: 2,
                crit: 3,
                armorModifier: -1,
                range: 4,
              },
            },

            chosenHitLocation:
              "torso",
          });

        expect(
          request
            .baseAttributeDie,
        ).toBe(12);

        expect(
          request
            .baseSkillDie,
        ).toBe(10);

        expect(
          request
            .bodyArmorLevels,
        ).toEqual([2]);

        expect(
          request
            .weaponBaseDamage,
        ).toBe(2);
      },
    );
  },
);
