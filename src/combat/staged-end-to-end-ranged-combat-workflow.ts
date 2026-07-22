import type {
  RangedAttackRequest,
  RangedAttackResult,
} from "./ranged-attack-types";
import {
  RangedAttackResolver,
} from "./ranged-attack-resolver";
import {
  PostHitResolver,
  type PostHitResolutionRequest,
  type PostHitResolutionResult,
} from "./post-hit-resolver";
import {
  CriticalInjuryRollResolver,
  type CriticalInjuryRollResult,
} from "./critical-injury-roll-resolver";
import {
  DeathSaveResolver,
} from "./death-save-resolver";
import type {
  DeathSaveState,
} from "./death-save-state";
import {
  getShotgunRangeDamageReduction,
} from "./shotgun-range";
import {
  AmmoAttackResolver,
  type AmmoAttackRequest,
  type AmmoAttackResult,
} from "./ammo-resolver";

export interface StagedEndToEndRangedCombatRequest
  extends RangedAttackRequest {
  targetActorId: string;

  weaponBaseDamage: number;
  critThreshold: number;
  weaponArmorModifier: number;

  bodyArmorLevels?: number[];
  externalArmorLevel?: number;

  chosenHitLocation?:
    PostHitResolutionRequest[
      "chosenHitLocation"
    ];

  /**
   * Present only for weapons using the recognized T2K4E magazine schema.
   * Legacy and otherwise untracked weapons omit this field.
   */
  ammunition?: AmmoAttackRequest;
}

export interface StagedEndToEndRangedCombatResult {
  attack: RangedAttackResult;
  ammunition?: AmmoAttackResult;
  hit: boolean;

  postHit?:
    PostHitResolutionResult;

  criticalInjury?:
    CriticalInjuryRollResult;

  deathSaveState?:
    DeathSaveState;

  targetActorId: string;

  /**
   * Staged results never mutate actor state.
   */
  targetUpdated: false;
}

export class StagedEndToEndRangedCombatWorkflow {
  constructor(
    private readonly rangedAttackResolver:
      RangedAttackResolver,
    private readonly postHitResolver:
      PostHitResolver,
    private readonly criticalInjuryRollResolver:
      CriticalInjuryRollResolver,
    private readonly deathSaveResolver:
      DeathSaveResolver,
    private readonly ammoAttackResolver?:
      AmmoAttackResolver,
  ) {}

  async resolve(
    request:
      StagedEndToEndRangedCombatRequest,
  ): Promise<
    StagedEndToEndRangedCombatResult
  > {
    if (request.ammunition) {
      if (!this.ammoAttackResolver) {
        throw new Error(
          "A tracked-ammunition attack requires an ammo resolver.",
        );
      }

      // Validate before rolling any attack dice so an empty magazine or an
      // illegal ammo-dice request cannot partially resolve an attack.
      this.ammoAttackResolver
        .validate(
          request.ammunition,
        );
    }

    const attack =
      await this.rangedAttackResolver
        .resolve(request);

    const ammunition =
      request.ammunition
        ? await this
            .ammoAttackResolver!
            .resolve(
              request.ammunition,
            )
        : undefined;

    const hit =
      attack.roll.successes >= 1;

    if (!hit) {
      return {
        attack,
        ammunition,
        hit: false,
        targetActorId:
          request.targetActorId,
        targetUpdated: false,
      };
    }

    const extraSuccesses =
      Math.max(
        0,
        attack.roll.successes - 1,
      ) +
      (
        ammunition
          ?.damageSuccesses ??
        0
      );

    const effectiveWeaponBaseDamage =
      this.getEffectiveWeaponBaseDamage(
        request.weaponBaseDamage,
        attack.context,
      );

    const postHit =
      await this.postHitResolver.resolve({
        weaponBaseDamage:
          effectiveWeaponBaseDamage,
        extraSuccesses,
        critThreshold:
          request.critThreshold,
        weaponArmorModifier:
          request.weaponArmorModifier,
        bodyArmorLevels:
          request.bodyArmorLevels,
        externalArmorLevel:
          request.externalArmorLevel,
        chosenHitLocation:
          request.chosenHitLocation,
      });

    let criticalInjury:
      | CriticalInjuryRollResult
      | undefined;

    let deathSaveState:
      | DeathSaveState
      | undefined;

    if (
      postHit
        .criticalInjury
        .triggered
    ) {
      criticalInjury =
        await this
          .criticalInjuryRollResolver
          .resolve({
            location:
              postHit.location,
            d10Count:
              postHit
                .criticalInjury
                .d10Count,
          });

      deathSaveState =
        this.deathSaveResolver
          .fromCriticalInjury(
            criticalInjury.injury,
          );
    }

    return {
      attack,
      ammunition,
      hit: true,
      postHit,
      criticalInjury,
      deathSaveState,
      targetActorId:
        request.targetActorId,
      targetUpdated: false,
    };
  }

  private getEffectiveWeaponBaseDamage(
    weaponBaseDamage: number,
    context: RangedAttackResult["context"],
  ): number {
    if (
      !context.usesShotgunRangeRules ||
      !context.rangeBand ||
      context.rangeBand === "out-of-range"
    ) {
      return weaponBaseDamage;
    }

    const reduction =
      getShotgunRangeDamageReduction(
        context.rangeBand,
      );

    return Math.max(
      0,
      weaponBaseDamage - reduction,
    );
  }
}
