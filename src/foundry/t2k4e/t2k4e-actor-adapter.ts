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
      "system.attributes.str.value",
      "system.attributes.str",
      "system.attribute.str.value",
      "system.attribute.str",
      "system.str.value",
    ],
    agl: [
      "system.attributes.agl.value",
      "system.attributes.agl",
      "system.attribute.agl.value",
      "system.attribute.agl",
      "system.agl.value",
    ],
    int: [
      "system.attributes.int.value",
      "system.attributes.int",
      "system.attribute.int.value",
      "system.attribute.int",
      "system.int.value",
    ],
    emp: [
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
      "system.skills.closeCombat.value",
      "system.skills.closecombat.value",
      "system.skills.closeCombat",
    ],
    heavyWeapons: [
      "system.skills.heavyWeapons.value",
      "system.skills.heavyweapons.value",
      "system.skills.heavyWeapons",
    ],
    stamina: [
      "system.skills.stamina.value",
      "system.skills.stamina",
    ],
    driving: [
      "system.skills.driving.value",
      "system.skills.driving",
    ],
    rangedCombat: [
      "system.skills.rangedCombat.value",
      "system.skills.rangedcombat.value",
      "system.skills.rangedCombat",
    ],
    mobility: [
      "system.skills.mobility.value",
      "system.skills.mobility",
    ],
    recon: [
      "system.skills.recon.value",
      "system.skills.recon",
    ],
    survival: [
      "system.skills.survival.value",
      "system.skills.survival",
    ],
    tech: [
      "system.skills.tech.value",
      "system.skills.tech",
    ],
    command: [
      "system.skills.command.value",
      "system.skills.command",
    ],
    medicalAid: [
      "system.skills.medicalAid.value",
      "system.skills.medicalaid.value",
      "system.skills.medicalAid",
    ],
    persuasion: [
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
  ): StepDie {
    return normalizeStepDie(
      firstDefined(
        this.actor,
        SKILL_ALIASES[key],
      ),
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
}
