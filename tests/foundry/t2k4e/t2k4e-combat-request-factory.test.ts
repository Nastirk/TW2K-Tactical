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

    it(
      "adds tracked ammunition only for the official magazine schema",
      () => {
        const request =
          new T2K4ECombatRequestFactory()
            .createRangedAttack({
              attacker: {
                id: "attacker",
                type: "character",
                system: {
                  attributes: {
                    agl: { value: "C" },
                  },
                  skills: {
                    rangedCombat: { value: "C" },
                  },
                },
                items: [{
                  id: "magazine",
                  name: "5.56x45mm Magazine",
                  type: "gear",
                  system: {
                    ammo: {
                      value: 12,
                      max: 30,
                    },
                  },
                }],
              },
              target: {
                id: "target",
                type: "character",
              },
              weapon: {
                id: "rifle",
                type: "weapon",
                system: {
                  damage: 2,
                  crit: 3,
                  armorModifier: 0,
                  range: 4,
                  rof: 3,
                  ammo: "5.56x45mm",
                  mag: {
                    target: "magazine",
                    max: 30,
                  },
                },
              },
            });

        expect(request.ammunition).toEqual({
          ammunitionItemId: "magazine",
          rateOfFire: 3,
          roundsBefore: 12,
          ammoDice: 0,
          allocation: "damage",
          slowAim: false,
        });
      },
    );
  },
);
