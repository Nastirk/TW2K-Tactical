import {
  describe,
  expect,
  it,
} from "vitest";

import {
  DeathSaveResolver,
} from "../../src/combat/death-save-resolver";

describe("DeathSaveResolver", () => {
  const resolver =
    new DeathSaveResolver();

  it(
    "does not require death saves for non-lethal injuries",
    () => {
      const state =
        resolver.fromCriticalInjury({
          roll: 1,
          location: "head",
          injury: "Ear slashed",
          lethal: false,
          timeLimit: null,
          effects: [],
          healTime: "D6 days",
        });

      expect(state.status).toBe(
        "not-required",
      );
    },
  );

  it(
    "marks instant-death injuries as dead",
    () => {
      const state =
        resolver.fromCriticalInjury({
          roll: 10,
          location: "head",
          injury:
            "Brains blown out",
          lethal: true,
          timeLimit: null,
          effects: [
            "Instant death",
          ],
          healTime: null,
          instantDeath: true,
        });

      expect(state.status).toBe(
        "dead",
      );
    },
  );

  it(
    "requires death saves for lethal injuries with a time limit",
    () => {
      const state =
        resolver.fromCriticalInjury({
          roll: 9,
          location: "torso",
          injury:
            "Internal bleeding",
          lethal: true,
          timeLimit: "round",
          effects: [],
          healTime: "3D6 days",
        });

      expect(state.status).toBe(
        "required",
      );

      expect(
        state.timeLimit,
      ).toBe("round");
    },
  );

  it(
    "kills on a failed death save",
    () => {
      const state =
        resolver.applyDeathSaveResult(
          {
            lethal: true,
            instantDeath: false,
            status: "required",
            timeLimit: "stretch",
          },
          false,
        );

      expect(state.status).toBe(
        "dead",
      );
    },
  );

  it(
    "keeps the state unchanged on a successful death save",
    () => {
      const original = {
        lethal: true,
        instantDeath: false,
        status:
          "required" as const,
        timeLimit:
          "stretch" as const,
      };

      expect(
        resolver.applyDeathSaveResult(
          original,
          true,
        ),
      ).toEqual(original);
    },
  );

  it(
    "requires an immediate save when the wounded character moves",
    () => {
      expect(
        resolver
          .requiresImmediateSaveOnSelfMovement(
            {
              lethal: true,
              instantDeath: false,
              status:
                "required",
              timeLimit:
                "shift",
            },
          ),
      ).toBe(true);
    },
  );

  it(
    "requires an immediate save when another person moves the wounded and Medical Aid fails",
    () => {
      const state = {
        lethal: true,
        instantDeath: false,
        status:
          "required" as const,
        timeLimit:
          "shift" as const,
      };

      expect(
        resolver
          .requiresImmediateSaveWhenMovedByOther(
            state,
            false,
          ),
      ).toBe(true);

      expect(
        resolver
          .requiresImmediateSaveWhenMovedByOther(
            state,
            true,
          ),
      ).toBe(false);
    },
  );
});
