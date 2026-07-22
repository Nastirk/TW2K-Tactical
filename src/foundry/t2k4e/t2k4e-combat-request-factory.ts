import type {
  HitLocation,
} from "../../combat/hit-location-resolver";
import type {
  StagedEndToEndRangedCombatRequest,
} from "../../combat/staged-end-to-end-ranged-combat-workflow";
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
import {
  T2K4EAmmunitionAdapter,
} from "./t2k4e-ammunition-adapter";

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
  constructor(
    private readonly ammunitionAdapter =
      new T2K4EAmmunitionAdapter(),
  ) {}

  createRangedAttack(
    input:
      T2K4ERangedCombatInput,
  ): StagedEndToEndRangedCombatRequest {
    const attacker =
      new T2K4EActorAdapter(
        input.attacker,
      );

    const weapon =
      new T2K4EWeaponAdapter(
        input.weapon,
      ).toProfile();

    const ammunitionState =
      this.ammunitionAdapter
        .getWeaponAmmoState(
          input.attacker,
          input.weapon,
        );

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

      ...(ammunitionState
        ? {
            ammunition:
              this.ammunitionAdapter
                .toAttackRequest(
                  ammunitionState,
                ),
          }
        : {}),
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
      .flatMap(
        (item) => {
          const realSchemaArmor =
            this.readRealT2K4EArmorLevel(
              item,
              location,
            );

          // T2K4E 14.0.1 armor items use:
          //   system.equipped
          //   system.rating.value
          //   system.location.{head,arms,torso,legs}
          //
          // When that schema is present, trust it instead of falling
          // through to legacy adapter paths. `null` means the item is
          // recognized but does not protect this location (or is not
          // equipped); `undefined` means consider the legacy adapter.
          if (
            realSchemaArmor !==
            undefined
          ) {
            return realSchemaArmor ===
              null
              ? []
              : [realSchemaArmor];
          }

          // Ordinary T2K4E gear items are not armor. Only use the
          // legacy adapter when the item actually exposes a legacy
          // armor field. This prevents normal gear such as Fatigues
          // from being passed to T2K4EArmorAdapter and throwing.
          const legacySystem =
            this.asRecord(
              (
                item as {
                  system?: unknown;
                }
              ).system,
            );

          const hasLegacyArmorField =
            legacySystem !==
              undefined &&
            (
              "armor" in
                legacySystem ||
              "armorLevel" in
                legacySystem ||
              "protection" in
                legacySystem
            );

          if (
            !hasLegacyArmorField
          ) {
            return [];
          }

          const armor =
            new T2K4EArmorAdapter(
              item,
            );

          if (
            !armor.isEquipped()
          ) {
            return [];
          }

          const profile =
            armor.toProfile();

          return profile.locations
            .includes(
              location,
            )
            ? [
                profile
                  .armorLevel,
              ]
            : [];
        },
      );
  }

  private readRealT2K4EArmorLevel(
    item:
      T2K4EItemLike,
    location:
      HitLocation,
  ): number | null | undefined {
    const system =
      this.asRecord(
        (
          item as {
            system?: unknown;
          }
        ).system,
      );

    const rating =
      this.asRecord(
        system?.rating,
      );

    const coverage =
      this.asRecord(
        system?.location,
      );

    const armorLevel =
      rating?.value;

    // Not the observed T2K4E 14.0.1 armor schema:
    // preserve legacy adapter compatibility when an actual
    // legacy armor field is present.
    if (
      !coverage ||
      typeof armorLevel !==
        "number" ||
      !Number.isFinite(
        armorLevel,
      )
    ) {
      return undefined;
    }

    if (
      system?.equipped !==
      true
    ) {
      return null;
    }

    const coverageKey =
      location ===
      "arm"
        ? "arms"
        : location;

    if (
      coverage[
        coverageKey
      ] !== true
    ) {
      return null;
    }

    return Math.max(
      0,
      Math.trunc(
        armorLevel,
      ),
    );
  }

  private asRecord(
    value: unknown,
  ): Record<
    string,
    unknown
  > | undefined {
    if (
      !value ||
      typeof value !==
        "object"
    ) {
      return undefined;
    }

    return value as Record<
      string,
      unknown
    >;
  }
}
