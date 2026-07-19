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
    if (
      payload.finalDamage > 0
    ) {
      await this.actorStateService
        .applyDamage({
          actorId:
            payload.targetActorId,
          damage:
            payload.finalDamage,
        });
    }

    if (
      payload.criticalInjury
    ) {
      await this.actorStateService
        .addCriticalInjury(
          payload.targetActorId,
          payload.criticalInjury,
        );
    }

    if (
      payload.deathSaveState
    ) {
      await this.actorStateService
        .setDeathSaveState(
          payload.targetActorId,
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
