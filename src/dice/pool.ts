import type { DicePoolInput, StepDie } from "./types";

export class DicePool {
  private constructor(
    public readonly attribute?: StepDie,
    public readonly skill?: StepDie,
  ) {}

  static from(input: DicePoolInput): DicePool {
    return new DicePool(input.attribute, input.skill);
  }

  get dice(): StepDie[] {
    return [this.attribute, this.skill].filter(
      (die): die is StepDie => die !== undefined,
    );
  }

  get size(): number {
    return this.dice.length;
  }
}
