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
import {
  ActorStateService,
} from "./actor-state-service";

export interface EndToEndRangedCombatRequest
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
}

export interface EndToEndRangedCombatResult {
  attack: RangedAttackResult;
  hit: boolean;

  postHit?:
    PostHitResolutionResult;

  criticalInjury?:
    CriticalInjuryRollResult;

  targetUpdated:
    boolean;
}

export class EndToEndRangedCombatWorkflow {
  constructor(
    private readonly rangedAttackResolver:
      RangedAttackResolver,
    private readonly postHitResolver:
      PostHitResolver,
    private readonly criticalInjuryRollResolver:
      CriticalInjuryRollResolver,
    private readonly deathSaveResolver:
      DeathSaveResolver,
    private readonly actorStateService:
      ActorStateService,
  ) {}

  async resolve(
    request:
      EndToEndRangedCombatRequest,
  ): Promise<
    EndToEndRangedCombatResult
  > {
    const attack =
      await this.rangedAttackResolver
        .resolve(request);

    const hit =
      attack.roll.successes >= 1;

    if (!hit) {
      return {
        attack,
        hit: false,
        targetUpdated: false,
      };
    }

    const extraSuccesses =
      Math.max(
        0,
        attack.roll.successes - 1,
      );

    const postHit =
      await this.postHitResolver.resolve({
        weaponBaseDamage:
          request.weaponBaseDamage,
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

    if (
      postHit.finalDamage > 0
    ) {
      await this.actorStateService
        .applyDamage({
          actorId:
            request.targetActorId,
          damage:
            postHit.finalDamage,
        });
    }

    let criticalInjury:
      | CriticalInjuryRollResult
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

      await this.actorStateService
        .addCriticalInjury(
          request.targetActorId,
          criticalInjury.injury,
        );

      const deathSaveState =
        this.deathSaveResolver
          .fromCriticalInjury(
            criticalInjury.injury,
          );

      if (
        deathSaveState.status !==
        "not-required"
      ) {
        await this.actorStateService
          .setDeathSaveState(
            request.targetActorId,
            deathSaveState,
          );
      }
    }

    return {
      attack,
      hit: true,
      postHit,
      criticalInjury,
      targetUpdated: true,
    };
  }
}
