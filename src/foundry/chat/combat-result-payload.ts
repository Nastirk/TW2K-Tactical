import type {
  CriticalInjuryEntry,
} from "../../combat/critical-injury-table";
import type {
  DeathSaveState,
} from "../../combat/death-save-state";

export interface CombatResultPayload {
  targetActorId: string;

  /**
   * Full Foundry UUID for the actor instance that was actually targeted.
   * Synthetic/unlinked token actors require this because their actor ID can
   * also resolve to a different world actor.
   */
  targetActorUuid?: string;

  finalDamage: number;
  criticalInjury?: CriticalInjuryEntry;
  deathSaveState?: DeathSaveState;
}

export function isCombatResultPayload(
  value: unknown,
): value is CombatResultPayload {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  return (
    typeof record.targetActorId ===
      "string" &&
    (
      record.targetActorUuid ===
        undefined ||
      typeof record.targetActorUuid ===
        "string"
    ) &&
    Number.isInteger(
      record.finalDamage,
    ) &&
    (record.finalDamage as number) >= 0
  );
}
