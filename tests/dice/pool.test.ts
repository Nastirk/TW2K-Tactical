import { describe, expect, it } from "vitest";
import { DicePool } from "../../src/dice/pool";
import { DiceEngine, type DieRoller } from "../../src/dice/roller";
import type { StepDie } from "../../src/dice/types";

class FixedRoller implements DieRoller {
  private index = 0;
  constructor(private readonly values: number[]) {}
  async rollDie(_sides: StepDie): Promise<number> {
    return this.values[this.index++]!;
  }
}

describe("DicePool", () => {
  it("builds a pool from attribute and skill dice", () => {
    const pool = DicePool.from({ attribute: 8, skill: 10 });
    expect(pool.dice).toEqual([8, 10]);
    expect(pool.size).toBe(2);
  });

  it("supports a pool with one die", () => {
    const pool = DicePool.from({ attribute: 6 });
    expect(pool.dice).toEqual([6]);
    expect(pool.size).toBe(1);
  });
});

describe("DiceEngine", () => {
  it("returns structured roll results and counts successes", async () => {
    const pool = DicePool.from({ attribute: 8, skill: 12 });
    const engine = new DiceEngine(new FixedRoller([6, 10]));
    const result = await engine.roll(pool);

    expect(result.rolls).toEqual([
      { sides: 8, value: 6 },
      { sides: 12, value: 10 },
    ]);
    expect(result.successes).toBe(3);
  });

  it("throws when a roller returns an invalid result", async () => {
    const pool = DicePool.from({ attribute: 6 });
    const engine = new DiceEngine(new FixedRoller([7]));
    await expect(engine.roll(pool)).rejects.toThrow("Invalid roll result");
  });
});
