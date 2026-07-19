import {
  describe,
  expect,
  it,
} from "vitest";

import {
  CriticalInjuryRollResolver,
} from "../../src/combat/critical-injury-roll-resolver";
import {
  CriticalInjuryTableResolver,
} from "../../src/combat/critical-injury-table-resolver";

describe(
  "CriticalInjuryRollResolver",
  () => {
    it(
      "rolls one D10 for a normal critical injury",
      async () => {
        const resolver =
          new CriticalInjuryRollResolver(
            {
              rollD10:
                async () => 5,
            },
            new CriticalInjuryTableResolver(),
          );

        const result =
          await resolver.resolve({
            location: "head",
            d10Count: 1,
          });

        expect(
          result.rolls,
        ).toEqual([5]);

        expect(
          result.selectedRoll,
        ).toBe(5);

        expect(
          result.injury.injury,
        ).toBe(
          "Cracked skull",
        );
      },
    );

    it(
      "keeps the highest result for a severe critical injury",
      async () => {
        const values = [
          3,
          9,
          5,
        ];

        const resolver =
          new CriticalInjuryRollResolver(
            {
              rollD10:
                async () =>
                  values.shift()!,
            },
            new CriticalInjuryTableResolver(),
          );

        const result =
          await resolver.resolve({
            location: "legs",
            d10Count: 3,
          });

        expect(
          result.rolls,
        ).toEqual([
          3,
          9,
          5,
        ]);

        expect(
          result.selectedRoll,
        ).toBe(9);

        expect(
          result.injury.injury,
        ).toBe(
          "Arterial bleeding",
        );
      },
    );

    it(
      "rejects zero D10s",
      async () => {
        const resolver =
          new CriticalInjuryRollResolver(
            {
              rollD10:
                async () => 1,
            },
            new CriticalInjuryTableResolver(),
          );

        await expect(
          resolver.resolve({
            location: "torso",
            d10Count: 0,
          }),
        ).rejects.toThrow(
          "d10Count must be a positive integer.",
        );
      },
    );
  },
);
