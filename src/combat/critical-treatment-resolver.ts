import type {
  CriticalTimeLimit,
} from "./critical-injury-table";
import type {
  DeathSaveState,
} from "./death-save-state";

export interface CriticalTreatmentResult {
  previousTimeLimit: CriticalTimeLimit;
  newTimeLimit: CriticalTimeLimit;
  stabilized: boolean;
  state: DeathSaveState;
}

export class CriticalTreatmentResolver {
  applyMedicalAid(
    state: DeathSaveState,
    succeeded: boolean,
  ): CriticalTreatmentResult {
    const previousTimeLimit =
      state.timeLimit;

    if (
      !succeeded ||
      state.status !== "required" ||
      !state.lethal ||
      state.instantDeath
    ) {
      return {
        previousTimeLimit,
        newTimeLimit:
          state.timeLimit,
        stabilized:
          state.status === "stabilized",
        state,
      };
    }

    const next =
      this.nextTimeLimit(
        state.timeLimit,
      );

    if (next === "stabilized") {
      const stabilizedState:
        DeathSaveState = {
          ...state,
          status: "stabilized",
          timeLimit: null,
        };

      return {
        previousTimeLimit,
        newTimeLimit: null,
        stabilized: true,
        state: stabilizedState,
      };
    }

    const improvedState:
      DeathSaveState = {
        ...state,
        timeLimit: next,
      };

    return {
      previousTimeLimit,
      newTimeLimit: next,
      stabilized: false,
      state: improvedState,
    };
  }

  private nextTimeLimit(
    timeLimit: CriticalTimeLimit,
  ):
    | Exclude<
        CriticalTimeLimit,
        null
      >
    | "stabilized" {
    switch (timeLimit) {
      case "round":
        return "stretch";

      case "stretch":
        return "shift";

      case "shift":
        return "stabilized";

      default:
        return "stabilized";
    }
  }
}
