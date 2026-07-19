import {
  describe,
  expect,
  it,
} from "vitest";

import {
  CriticalTreatmentResolver,
} from "../../src/combat/critical-treatment-resolver";
import {
  DeathSaveResolver,
} from "../../src/combat/death-save-resolver";
import {
  LethalCriticalWorkflow,
} from "../../src/combat/lethal-critical-workflow";

describe(
  "LethalCriticalWorkflow",
  () => {
    it(
      "starts a lethal injury workflow",
      () => {
        const workflow =
          new LethalCriticalWorkflow(
            new DeathSaveResolver(),
            new CriticalTreatmentResolver(),
          );

        const result =
          workflow.start({
            roll: 9,
            location: "head",
            injury:
              "Crushed windpipe",
            lethal: true,
            timeLimit: "round",
            effects: [],
            healTime: "3D6 days",
          });

        expect(
          result
            .deathSaveState
            .status,
        ).toBe("required");

        expect(
          result
            .deathSaveState
            .timeLimit,
        ).toBe("round");
      },
    );

    it(
      "can progress treatment until stabilized",
      () => {
        const workflow =
          new LethalCriticalWorkflow(
            new DeathSaveResolver(),
            new CriticalTreatmentResolver(),
          );

        let state =
          workflow.start({
            roll: 9,
            location: "head",
            injury:
              "Crushed windpipe",
            lethal: true,
            timeLimit: "round",
            effects: [],
            healTime: "3D6 days",
          }).deathSaveState;

        state =
          workflow.treat(
            state,
            true,
          );

        expect(
          state.timeLimit,
        ).toBe("stretch");

        state =
          workflow.treat(
            state,
            true,
          );

        expect(
          state.timeLimit,
        ).toBe("shift");

        state =
          workflow.treat(
            state,
            true,
          );

        expect(
          state.status,
        ).toBe(
          "stabilized",
        );
      },
    );
  },
);
