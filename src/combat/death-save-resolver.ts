import type {
  CriticalInjuryEntry,
} from "./critical-injury-table";
import type {
  DeathSaveState,
} from "./death-save-state";

export class DeathSaveResolver {
  fromCriticalInjury(
    injury: CriticalInjuryEntry,
  ): DeathSaveState {
    if (!injury.lethal) {
      return {
        lethal: false,
        instantDeath: false,
        status: "not-required",
        timeLimit: null,
      };
    }

    if (injury.instantDeath) {
      return {
        lethal: true,
        instantDeath: true,
        status: "dead",
        timeLimit: null,
      };
    }

    return {
      lethal: true,
      instantDeath: false,
      status: "required",
      timeLimit: injury.timeLimit,
    };
  }

  requiresImmediateSaveOnSelfMovement(
    state: DeathSaveState,
  ): boolean {
    return (
      state.status === "required" &&
      state.lethal &&
      !state.instantDeath
    );
  }

  requiresImmediateSaveWhenMovedByOther(
    state: DeathSaveState,
    medicalAidSucceeded: boolean,
  ): boolean {
    if (
      state.status !== "required" ||
      !state.lethal ||
      state.instantDeath
    ) {
      return false;
    }

    return !medicalAidSucceeded;
  }

  applyDeathSaveResult(
    state: DeathSaveState,
    succeeded: boolean,
  ): DeathSaveState {
    if (state.status !== "required") {
      return state;
    }

    if (succeeded) {
      return state;
    }

    return {
      ...state,
      status: "dead",
    };
  }
}
