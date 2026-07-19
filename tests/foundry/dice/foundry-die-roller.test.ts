import { describe, expect, it, vi } from "vitest";
import { FoundryDieRoller } from "../../../src/foundry/dice/foundry-die-roller";

describe("FoundryDieRoller", () => {
  it("creates and evaluates a Foundry Roll", async () => {
    const evaluate = vi.fn().mockResolvedValue({ total: 7 });

    class MockRoll {
      public total: number | null = null;
      constructor(public formula: string) {}
      async evaluate() {
        const result = await evaluate();
        this.total = result.total;
        return this;
      }
    }

    vi.stubGlobal("Roll", MockRoll);
    const result = await new FoundryDieRoller().rollDie(8);

    expect(result).toBe(7);
    expect(evaluate).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
