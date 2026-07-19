import {
  describe,
  expect,
  it,
} from "vitest";

import {
  CriticalInjuryTableResolver,
} from "../../src/combat/critical-injury-table-resolver";

describe(
  "CriticalInjuryTableResolver",
  () => {
    const resolver =
      new CriticalInjuryTableResolver();

    it(
      "resolves a head injury",
      () => {
        const result =
          resolver.resolve(
            "head",
            10,
          );

        expect(
          result.injury,
        ).toBe(
          "Brains blown out",
        );

        expect(
          result.instantDeath,
        ).toBe(true);
      },
    );

    it(
      "resolves a torso injury",
      () => {
        const result =
          resolver.resolve(
            "torso",
            9,
          );

        expect(
          result.injury,
        ).toBe(
          "Internal bleeding",
        );

        expect(
          result.timeLimit,
        ).toBe("round");
      },
    );

    it(
      "adds the automatic fall-down effect to leg crits",
      () => {
        expect(
          resolver.resolve(
            "legs",
            1,
          ).effects,
        ).toContain(
          "Fall down",
        );
      },
    );

    it(
      "adds the automatic drop-items effect to arm crits",
      () => {
        expect(
          resolver.resolve(
            "arm",
            1,
          ).effects,
        ).toContain(
          "Drop held items",
        );
      },
    );

    it(
      "rejects invalid rolls",
      () => {
        expect(() =>
          resolver.resolve(
            "head",
            11,
          ),
        ).toThrow(
          "Critical-injury roll must be an integer from 1 to 10.",
        );
      },
    );
  },
);
