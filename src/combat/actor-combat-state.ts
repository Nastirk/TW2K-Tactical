import type {
  CriticalInjuryEntry,
} from "./critical-injury-table";
import type {
  DeathSaveState,
} from "./death-save-state";

export interface ActorCombatState {
  damage: number;
  hitCapacity: number;
  incapacitated: boolean;
  criticalInjuries:
    CriticalInjuryEntry[];
  deathSaveState?: DeathSaveState;
}
