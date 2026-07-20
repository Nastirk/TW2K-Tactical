import type {
  RangedCombatModifierInput,
} from "../../rules/ranged-combat-modifier-types";
import type {
  StepDie,
} from "../../dice/types";
import {
  T2K4EActorAdapter,
} from "./t2k4e-actor-adapter";
import type {
  T2K4EActorLike,
} from "./t2k4e-types";

export interface T2K4ERangedDiceSelection {
  baseAttributeDie: StepDie;
  baseSkillDie?: StepDie;
}

export class T2K4ERangedDiceSelector {
  select(
    actorLike:
      T2K4EActorLike,
    modifiers:
      RangedCombatModifierInput,
  ): T2K4ERangedDiceSelection {
    const actor =
      new T2K4EActorAdapter(
        actorLike,
      );

    const isMachineGun =
      modifiers.weaponCategory ===
        "lmg" ||
      modifiers.weaponCategory ===
        "gpmg" ||
      modifiers.weaponCategory ===
        "hmg";

    if (!isMachineGun) {
      return {
        baseAttributeDie:
          actor.getAttributeDie(
            "agl",
          ),
        baseSkillDie:
          actor.getSkillDie(
            "rangedCombat",
          ),
      };
    }

    const mounted =
      modifiers.tripodDeployed ===
        true ||
      modifiers.vehicleMounted ===
        true;

    return {
      baseAttributeDie:
        actor.getAttributeDie(
          mounted
            ? "agl"
            : "str",
        ),
      baseSkillDie:
        actor.getSkillDie(
          "heavyWeapons",
        ),
    };
  }
}
