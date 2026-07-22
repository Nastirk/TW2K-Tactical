import {
  describe,
  expect,
  it,
} from "vitest";

import {
  T2K4EActorAdapter,
} from "../../../src/foundry/t2k4e/t2k4e-actor-adapter";

describe(
  "T2K4EActorAdapter",
  () => {
    it(
      "reads combat dice and health from legacy value-style data",
      () => {
        const adapter =
          new T2K4EActorAdapter({
            id: "a",
            type: "character",
            system: {
              attributes: {
                agl: {
                  value: "B",
                },
              },
              skills: {
                rangedCombat: {
                  value: "C",
                },
              },
              health: {
                damage: 2,
                capacity: 6,
              },
            },
          });

        expect(
          adapter.getAttributeDie(
            "agl",
          ),
        ).toBe(10);

        expect(
          adapter.getSkillDie(
            "rangedCombat",
          ),
        ).toBe(8);

        expect(
          adapter.getDamage(),
        ).toBe(2);

        expect(
          adapter.getHitCapacity(),
        ).toBe(6);
      },
    );

    it(
      "reads the real T2K4E 14 score schema and treats untrained skills as no skill die",
      () => {
        const adapter =
          new T2K4EActorAdapter({
            id: "a",
            type: "character",
            system: {
              attributes: {
                str: {
                  score: "A",
                },
                agl: {
                  score: "B",
                },
              },
              skills: {
                heavyWeapons: {
                  score: "D",
                },
                rangedCombat: {
                  score: "–",
                },
              },
            },
          });

        expect(
          adapter.getAttributeDie(
            "str",
          ),
        ).toBe(12);

        expect(
          adapter.getAttributeDie(
            "agl",
          ),
        ).toBe(10);

        expect(
          adapter.getSkillDie(
            "heavyWeapons",
          ),
        ).toBe(6);

        expect(
          adapter.getSkillDie(
            "rangedCombat",
          ),
        ).toBeUndefined();
      },
    );
  },
);
