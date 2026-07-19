import type {
  HitLocation,
} from "../../combat/hit-location-resolver";
import type {
  EndToEndRangedCombatRequest,
} from "../../combat/end-to-end-ranged-combat-workflow";
import {
  T2K4EActorAdapter,
} from "./t2k4e-actor-adapter";
import {
  T2K4EArmorAdapter,
} from "./t2k4e-armor-adapter";
import type {
  T2K4EActorLike,
  T2K4EItemLike,
} from "./t2k4e-types";
import {
  T2K4EWeaponAdapter,
} from "./t2k4e-weapon-adapter";

export interface T2K4ERangedCombatInput {
  attacker:
    T2K4EActorLike;
  target:
    T2K4EActorLike;
  weapon:
    T2K4EItemLike;
  chosenHitLocation?:
    HitLocation;
  externalArmorLevel?: number;
}

export class T2K4ECombatRequestFactory {
  createRangedAttack(
    input:
      T2K4ERangedCombatInput,
  ): EndToEndRangedCombatRequest {
    const attacker =
      new T2K4EActorAdapter(
        input.attacker,
      );

    const weapon =
      new T2K4EWeaponAdapter(
        input.weapon,
      ).toProfile();

    return {
      attackerId:
        input.attacker.id,
      targetId:
        input.target.id,
      targetActorId:
        input.target.id,
      weaponId:
        input.weapon.id,

      baseAttributeDie:
        attacker.getAttributeDie(
          "agl",
        ),
      baseSkillDie:
        attacker.getSkillDie(
          "rangedCombat",
        ),

      weaponBaseDamage:
        weapon.baseDamage,
      critThreshold:
        weapon.critThreshold,
      weaponArmorModifier:
        weapon.armorModifier,

      bodyArmorLevels:
        this.getArmorLevels(
          input.target,
          input.chosenHitLocation,
        ),

      externalArmorLevel:
        input.externalArmorLevel,

      chosenHitLocation:
        input.chosenHitLocation,
    };
  }

  private getArmorLevels(
    target:
      T2K4EActorLike,
    location:
      HitLocation | undefined,
  ): number[] {
    if (!location) {
      return [];
    }

    return [
      ...(
        target.items ??
        []
      ),
    ]
      .filter(
        (item) =>
          item.type ===
            "armor" ||
          item.type ===
            "gear",
      )
      .map(
        (item) =>
          new T2K4EArmorAdapter(
            item,
          ),
      )
      .filter(
        (armor) =>
          armor.isEquipped(),
      )
      .map(
        (armor) =>
          armor.toProfile(),
      )
      .filter(
        (armor) =>
          armor.locations.includes(
            location,
          ),
      )
      .map(
        (armor) =>
          armor.armorLevel,
      );
  }
}
