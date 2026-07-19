import type { DicePoolInput, StepDiePool } from "./types";

export class DicePool {
  private constructor(
    public readonly attribute?: StepDiePool["attribute"],
    public readonly skill?: StepDiePool["skill"],
  ) {}

  static from(input: DicePoolInput): DicePool {
    return new DicePool(input.attribute, input.skill);
  }

  get dice(): number[] {
    return [this.attribute, this.skill].filter(
      (die): die is NonNullable<typeof die> => die !== undefined,
    );
  }

  get size(): number {
    return this.dice.length;
  }
}
