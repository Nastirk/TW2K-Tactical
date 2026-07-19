import { DicePool } from "./pool";
import type { StepDie } from "./types";

const STEP_DICE: readonly StepDie[] = [6, 8, 10, 12];

function stepUp(die: StepDie): StepDie {
  const index = STEP_DICE.indexOf(die);
  return STEP_DICE[Math.min(index + 1, STEP_DICE.length - 1)]!;
}

function stepDown(die: StepDie): StepDie | undefined {
  const index = STEP_DICE.indexOf(die);

  if (index <= 0) {
    return undefined;
  }

  return STEP_DICE[index - 1];
}

export class DiceModifierApplicator {
  apply(pool: DicePool, modifier: number): DicePool {
    if (!Number.isInteger(modifier)) {
      throw new Error("modifier must be an integer.");
    }

    let dice = [...pool.dice];

    if (modifier > 0) {
      dice = this.applyPositive(dice, modifier);
    } else if (modifier < 0) {
      dice = this.applyNegative(dice, Math.abs(modifier));
    }

    return DicePool.from({
      attribute: dice[0],
      skill: dice[1],
    });
  }

  private applyPositive(
    dice: StepDie[],
    steps: number,
  ): StepDie[] {
    let remaining = steps;

    while (remaining > 0) {
      if (dice.length === 0) {
        dice.push(6);
        remaining -= 1;
        continue;
      }

      if (dice.length === 1) {
        dice.push(6);
        remaining -= 1;
        continue;
      }

      const candidates = dice
        .map((die, index) => ({
          die,
          index,
        }))
        .filter(({ die }) => die < 12)
        .sort((a, b) => a.die - b.die);

      const candidate = candidates[0];

      if (!candidate) {
        break;
      }

      dice[candidate.index] =
        stepUp(candidate.die);

      remaining -= 1;
    }

    return dice;
  }

  private applyNegative(
    dice: StepDie[],
    steps: number,
  ): StepDie[] {
    let remaining = steps;

    while (remaining > 0) {
      if (dice.length === 0) {
        dice.push(6);
        break;
      }

      if (
        dice.length === 1 &&
        dice[0] === 6
      ) {
        break;
      }

      let highestIndex = 0;

      for (
        let index = 1;
        index < dice.length;
        index += 1
      ) {
        if (
          dice[index]! >
          dice[highestIndex]!
        ) {
          highestIndex = index;
        }
      }

      const stepped =
        stepDown(dice[highestIndex]!);

      if (stepped === undefined) {
        if (dice.length > 1) {
          dice.splice(highestIndex, 1);
        } else {
          break;
        }
      } else {
        dice[highestIndex] = stepped;
      }

      remaining -= 1;
    }

    return dice;
  }
}
