import type {
  StagedEndToEndRangedCombatResult,
} from "../../combat/staged-end-to-end-ranged-combat-workflow";
import type {
  CombatResultPayload,
} from "./combat-result-payload";

export class CombatResultPayloadFactory {
  create(
    result:
      StagedEndToEndRangedCombatResult,
    targetActorUuid?: string,
  ): CombatResultPayload {
    return {
      targetActorId:
        result.targetActorId,

      ...(targetActorUuid
        ? { targetActorUuid }
        : {}),

      finalDamage:
        result.postHit
          ?.finalDamage ??
        0,

      criticalInjury:
        result
          .criticalInjury
          ?.injury,

      deathSaveState:
        result.deathSaveState,
    };
  }
}
