import { describe, expect, it, vi } from "vitest";
import { FoundryRandomHitLocationResolver } from "../../../src/foundry/runtime/foundry-random-hit-location-resolver";

describe("FoundryRandomHitLocationResolver", () => {
  it.each([
    [1, "legs"],
    [2, "torso"],
    [3, "torso"],
    [4, "torso"],
    [5, "arm"],
    [6, "head"],
  ])(
    "maps D6 result %i to %s",
    async (roll, expected) => {
      const rollDie = vi.fn(async () => roll);
      const resolver = new FoundryRandomHitLocationResolver({
        rollDie,
      } as never);

      await expect(resolver.resolve()).resolves.toBe(expected);
      expect(rollDie).toHaveBeenCalledWith(6);
    },
  );

  it("rejects invalid hit-location die results", async () => {
    const resolver = new FoundryRandomHitLocationResolver({
      rollDie: vi.fn(async () => 0),
    } as never);

    await expect(resolver.resolve()).rejects.toThrow(
      "Invalid TW2K hit-location D6 result",
    );
  });
});
