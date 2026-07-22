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
      "reads combat dice and health",
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
  },
);
