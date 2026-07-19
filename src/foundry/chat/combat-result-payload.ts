import type {
  CriticalInjuryEntry,
} from "../../combat/critical-injury-table";
import type {
  DeathSaveState,
} from "../../combat/death-save-state";

export interface CombatResultPayload {
  targetActorId: string;
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
    Number.isInteger(
      record.finalDamage,
    ) &&
    (record.finalDamage as number) >= 0
  );
}
