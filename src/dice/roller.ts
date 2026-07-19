import { DicePool } from "./pool";
import { countSuccesses, type DicePoolResult } from "./result";
import type { DiceRoll, StepDie } from "./types";

export interface DieRoller {
  rollDie(sides: StepDie): Promise<number>;
}

export class DiceEngine {
  constructor(private readonly roller: DieRoller) {}

  async roll(pool: DicePool): Promise<DicePoolResult> {
    const rolls: DiceRoll[] = [];

    for (const sides of pool.dice) {
      const value = await this.roller.rollDie(sides);

      if (!Number.isInteger(value) || value < 1 || value > sides) {
        throw new Error(
          `Invalid roll result ${value} for d${sides}. Expected an integer between 1 and ${sides}.`,
        );
      }

      rolls.push({ sides, value });
    }

    return {
      rolls,
      successes: countSuccesses(rolls),
    };
  }
}
