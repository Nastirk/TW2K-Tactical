import {
  describe,
  expect,
  it,
} from "vitest";

import {
  CriticalTreatmentResolver,
} from "../../src/combat/critical-treatment-resolver";

describe(
  "CriticalTreatmentResolver",
  () => {
    const resolver =
      new CriticalTreatmentResolver();

    it(
      "improves round to stretch",
      () => {
        const result =
          resolver.applyMedicalAid(
            {
              lethal: true,
              instantDeath: false,
              status:
                "required",
              timeLimit:
                "round",
            },
            true,
          );

        expect(
          result.newTimeLimit,
        ).toBe("stretch");

        expect(
          result.stabilized,
        ).toBe(false);
      },
    );

    it(
      "improves stretch to shift",
      () => {
        const result =
          resolver.applyMedicalAid(
            {
              lethal: true,
              instantDeath: false,
              status:
                "required",
              timeLimit:
                "stretch",
            },
            true,
          );

        expect(
          result.newTimeLimit,
        ).toBe("shift");
      },
    );

    it(
      "stabilizes a shift injury",
      () => {
        const result =
          resolver.applyMedicalAid(
            {
              lethal: true,
              instantDeath: false,
              status:
                "required",
              timeLimit:
                "shift",
            },
            true,
          );

        expect(
          result.stabilized,
        ).toBe(true);

        expect(
          result.state.status,
        ).toBe("stabilized");

        expect(
          result.state.timeLimit,
        ).toBeNull();
      },
    );

    it(
      "does not improve the state when Medical Aid fails",
      () => {
        const result =
          resolver.applyMedicalAid(
            {
              lethal: true,
              instantDeath: false,
              status:
                "required",
              timeLimit:
                "stretch",
            },
            false,
          );

        expect(
          result.newTimeLimit,
        ).toBe("stretch");

        expect(
          result.state.status,
        ).toBe("required");
      },
    );
  },
);
