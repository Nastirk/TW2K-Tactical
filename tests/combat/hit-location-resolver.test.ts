import { describe, expect, it } from "vitest";
import {
  HitLocationResolver,
  type HitLocationTable,
} from "../../src/combat/hit-location-resolver";

describe("HitLocationResolver", () => {
  it("uses the injected roll and table", async () => {
    const table: HitLocationTable = {
      resolve: (roll) =>
        roll === 3 ? "torso" : "head",
    };

    const resolver = new HitLocationResolver(
      { roll: async () => 3 },
      table,
    );

    await expect(resolver.resolve()).resolves.toBe(
      "torso",
    );
  });

  it("rejects invalid rolls", async () => {
    const resolver = new HitLocationResolver(
      { roll: async () => 0 },
      { resolve: () => "torso" },
    );

    await expect(
      resolver.resolve(),
    ).rejects.toThrow(
      "Hit-location roll must be a positive integer.",
    );
  });
});
