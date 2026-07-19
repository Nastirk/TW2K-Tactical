import {
  describe,
  expect,
  it,
} from "vitest";

import {
  HitLocationResolver,
} from "../../src/combat/hit-location-resolver";

describe(
  "HitLocationResolver",
  () => {
    it.each([
      [1, "legs"],
      [2, "torso"],
      [3, "torso"],
      [4, "torso"],
      [5, "arm"],
      [6, "head"],
    ] as const)(
      "maps D6 roll %s to %s",
      async (roll, expected) => {
        const resolver =
          new HitLocationResolver({
            rollD6: async () => roll,
          });

        await expect(
          resolver.resolve(),
        ).resolves.toBe(expected);
      },
    );

    it(
      "uses a chosen location without rolling",
      async () => {
        let rolled = false;

        const resolver =
          new HitLocationResolver({
            rollD6: async () => {
              rolled = true;
              return 1;
            },
          });

        await expect(
          resolver.resolve("head"),
        ).resolves.toBe("head");

        expect(rolled).toBe(false);
      },
    );

    it(
      "rejects invalid D6 results",
      async () => {
        const resolver =
          new HitLocationResolver({
            rollD6: async () => 7,
          });

        await expect(
          resolver.resolve(),
        ).rejects.toThrow(
          "Hit-location roll must be an integer from 1 to 6.",
        );
      },
    );
  },
);
