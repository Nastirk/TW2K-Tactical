import type {
  StepDie,
} from "../../dice/types";
import type {
  T2K4EActorLike,
  T2KAttributeKey,
  T2KSkillKey,
} from "./t2k4e-types";
import {
  firstDefined,
  readInteger,
} from "./t2k4e-path-reader";
import {
  normalizeStepDie,
} from "./t2k4e-step-die";

const ATTRIBUTE_ALIASES:
  Record<
    T2KAttributeKey,
    readonly string[]
  > = {
    str: [
      "system.attributes.str.score",
      "system.attributes.str.value",
      "system.attributes.str",
      "system.attribute.str.value",
      "system.attribute.str",
      "system.str.value",
    ],
    agl: [
      "system.attributes.agl.score",
      "system.attributes.agl.value",
      "system.attributes.agl",
      "system.attribute.agl.value",
      "system.attribute.agl",
      "system.agl.value",
    ],
    int: [
      "system.attributes.int.score",
      "system.attributes.int.value",
      "system.attributes.int",
      "system.attribute.int.value",
      "system.attribute.int",
      "system.int.value",
    ],
    emp: [
      "system.attributes.emp.score",
      "system.attributes.emp.value",
      "system.attributes.emp",
      "system.attribute.emp.value",
      "system.attribute.emp",
      "system.emp.value",
    ],
  };

const SKILL_ALIASES:
  Record<
    T2KSkillKey,
    readonly string[]
  > = {
    closeCombat: [
      "system.skills.closeCombat.score",
      "system.skills.closeCombat.value",
      "system.skills.closecombat.value",
      "system.skills.closeCombat",
    ],
    heavyWeapons: [
      "system.skills.heavyWeapons.score",
      "system.skills.heavyWeapons.value",
      "system.skills.heavyweapons.value",
      "system.skills.heavyWeapons",
    ],
    stamina: [
      "system.skills.stamina.score",
      "system.skills.stamina.value",
      "system.skills.stamina",
    ],
    driving: [
      "system.skills.driving.score",
      "system.skills.driving.value",
      "system.skills.driving",
    ],
    rangedCombat: [
      "system.skills.rangedCombat.score",
      "system.skills.rangedCombat.value",
      "system.skills.rangedcombat.value",
      "system.skills.rangedCombat",
    ],
    mobility: [
      "system.skills.mobility.score",
      "system.skills.mobility.value",
      "system.skills.mobility",
    ],
    recon: [
      "system.skills.recon.score",
      "system.skills.recon.value",
      "system.skills.recon",
    ],
    survival: [
      "system.skills.survival.score",
      "system.skills.survival.value",
      "system.skills.survival",
    ],
    tech: [
      "system.skills.tech.score",
      "system.skills.tech.value",
      "system.skills.tech",
    ],
    command: [
      "system.skills.command.score",
      "system.skills.command.value",
      "system.skills.command",
    ],
    medicalAid: [
      "system.skills.medicalAid.score",
      "system.skills.medicalAid.value",
      "system.skills.medicalaid.value",
      "system.skills.medicalAid",
    ],
    persuasion: [
      "system.skills.persuasion.score",
      "system.skills.persuasion.value",
      "system.skills.persuasion",
    ],
  };

export class T2K4EActorAdapter {
  constructor(
    private readonly actor:
      T2K4EActorLike,
  ) {}

  getAttributeDie(
    key: T2KAttributeKey,
  ): StepDie {
    return normalizeStepDie(
      firstDefined(
        this.actor,
        ATTRIBUTE_ALIASES[key],
      ),
      `attribute ${key}`,
    );
  }

  getSkillDie(
    key: T2KSkillKey,
  ): StepDie | undefined {
    const value =
      firstDefined(
        this.actor,
        SKILL_ALIASES[key],
      );

    if (
      typeof value === "string" &&
      [
        "f",
        "-",
        "–",
        "—",
      ].includes(
        value
          .trim()
          .toLowerCase(),
      )
    ) {
      return undefined;
    }

    return normalizeStepDie(
      value,
      `skill ${key}`,
    );
  }

  getDamage(): number {
    return readInteger(
      this.actor,
      [
        "system.health.damage",
        "system.damage.value",
        "system.damage",
      ],
      "actor damage",
    );
  }

  getHitCapacity(): number {
    return readInteger(
      this.actor,
      [
        "system.health.capacity",
        "system.hitCapacity.value",
        "system.hitCapacity",
        "system.health.max",
      ],
      "actor hit capacity",
    );
  }

  getItems():
    T2K4EActorLike["items"] {
    return this.actor.items;
  }

  hasSpecialty(
    name: string,
  ): boolean {
    const expected =
      this.normalizeName(name);

    return Array.from(
      this.actor.items ?? [],
    ).some(
      (item) => {
        const type =
          item.type.toLowerCase();

        if (
          type !== "specialty" &&
          type !== "speciality" &&
          type !== "talent"
        ) {
          return false;
        }

        return this.normalizeName(
          item.name ?? "",
        ) === expected;
      },
    );
  }

  private normalizeName(
    value: string,
  ): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }
}
