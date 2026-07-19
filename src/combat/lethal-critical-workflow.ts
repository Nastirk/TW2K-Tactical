import type {
  CriticalInjuryEntry,
} from "./critical-injury-table";
import {
  CriticalTreatmentResolver,
} from "./critical-treatment-resolver";
import {
  DeathSaveResolver,
} from "./death-save-resolver";
import type {
  DeathSaveState,
} from "./death-save-state";

export interface LethalCriticalWorkflowResult {
  injury: CriticalInjuryEntry;
  deathSaveState: DeathSaveState;
}

export class LethalCriticalWorkflow {
  constructor(
    private readonly deathSaveResolver:
      DeathSaveResolver,
    private readonly treatmentResolver:
      CriticalTreatmentResolver,
  ) {}

  start(
    injury: CriticalInjuryEntry,
  ): LethalCriticalWorkflowResult {
    return {
      injury,
      deathSaveState:
        this.deathSaveResolver
          .fromCriticalInjury(
            injury,
          ),
    };
  }

  treat(
    state: DeathSaveState,
    succeeded: boolean,
  ): DeathSaveState {
    return this.treatmentResolver
      .applyMedicalAid(
        state,
        succeeded,
      ).state;
  }

  resolveDeathSave(
    state: DeathSaveState,
    succeeded: boolean,
  ): DeathSaveState {
    return this.deathSaveResolver
      .applyDeathSaveResult(
        state,
        succeeded,
      );
  }
}
