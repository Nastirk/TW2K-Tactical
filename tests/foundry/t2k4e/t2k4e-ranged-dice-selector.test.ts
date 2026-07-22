import {
  describe,
  expect,
  it,
} from "vitest";
import {
  T2K4ERangedDiceSelector,
} from "../../../src/foundry/t2k4e/t2k4e-ranged-dice-selector";

const actor = {
  id: "actor",
  type: "character",
  system: {
    attributes: {
      str: { score: "A" },
      agl: { score: "B" },
    },
    skills: {
      rangedCombat: {
        score: "C",
      },
      heavyWeapons: {
        score: "D",
      },
    },
  },
};

describe(
  "T2K4ERangedDiceSelector",
  () => {
    const selector =
      new T2K4ERangedDiceSelector();

    it(
      "uses AGL and Ranged Combat for ordinary firearms",
      () => {
        expect(
          selector.select(
            actor,
            {
              weaponCategory:
                "rifle",
            },
          ),
        ).toEqual({
          baseAttributeDie: 10,
          baseSkillDie: 8,
        });
      },
    );

    it(
      "uses STR and Heavy Weapons for carried or bipod-supported machine guns",
      () => {
        expect(
          selector.select(
            actor,
            {
              weaponCategory:
                "lmg",
              bipodDeployed: true,
            },
          ),
        ).toEqual({
          baseAttributeDie: 12,
          baseSkillDie: 6,
        });
      },
    );

    it(
      "uses AGL and Heavy Weapons for tripod or vehicle-mounted machine guns",
      () => {
        expect(
          selector.select(
            actor,
            {
              weaponCategory:
                "gpmg",
              tripodDeployed:
                true,
            },
          ),
        ).toEqual({
          baseAttributeDie: 10,
          baseSkillDie: 6,
        });

        expect(
          selector.select(
            actor,
            {
              weaponCategory:
                "hmg",
              vehicleMounted:
                true,
            },
          ),
        ).toEqual({
          baseAttributeDie: 10,
          baseSkillDie: 6,
        });
      },
    );

    it(
      "supports an untrained Heavy Weapons skill by omitting the skill die",
      () => {
        expect(
          selector.select(
            {
              ...actor,
              system: {
                ...actor.system,
                skills: {
                  ...actor.system.skills,
                  heavyWeapons: {
                    score: "F",
                  },
                },
              },
            },
            {
              weaponCategory:
                "lmg",
            },
          ),
        ).toEqual({
          baseAttributeDie: 12,
          baseSkillDie: undefined,
        });
      },
    );
  },
);
