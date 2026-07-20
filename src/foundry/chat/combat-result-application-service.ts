import {
  ActorStateService,
} from "../../combat/actor-state-service";
import type {
  CombatResultPayload,
} from "./combat-result-payload";

export interface CombatResultApplicationResult {
  applied: boolean;
  targetActorId: string;
}

export class CombatResultApplicationService {
  constructor(
    private readonly actorStateService:
      ActorStateService,
  ) {}

  async apply(
    payload: CombatResultPayload,
  ): Promise<CombatResultApplicationResult> {
    // A synthetic token actor has the same actor ID as its base actor, but a
    // distinct UUID. Prefer the UUID so Apply Result updates the exact actor
    // instance that was targeted when the attack was rolled.
    const targetActorReference =
      payload.targetActorUuid ??
      payload.targetActorId;

    if (
      payload.finalDamage > 0
    ) {
      await this.actorStateService
        .applyDamage({
          actorId:
            targetActorReference,
          damage:
            payload.finalDamage,
        });
    }

    if (
      payload.criticalInjury
    ) {
      await this.actorStateService
        .addCriticalInjury(
          targetActorReference,
          payload.criticalInjury,
        );
    }

    if (
      payload.deathSaveState
    ) {
      await this.actorStateService
        .setDeathSaveState(
          targetActorReference,
          payload.deathSaveState,
        );
    }

    return {
      applied: true,
      targetActorId:
        payload.targetActorId,
    };
  }
}
