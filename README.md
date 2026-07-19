import type { DiceRoll } from "./types";

export interface DicePoolResult {
  rolls: DiceRoll[];
  successes: number;
}

export function countSuccesses(rolls: DiceRoll[]): number {
  return rolls.reduce((total, roll) => {
    if (roll.value >= 10) return total + 2;
    if (roll.value >= 6) return total + 1;
    return total;
  }, 0);
}
