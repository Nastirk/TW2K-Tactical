export type StepDie = 6 | 8 | 10 | 12;

export interface StepDiePool {
  attribute?: StepDie;
  skill?: StepDie;
}

export interface DiceRoll {
  sides: StepDie;
  value: number;
}

export interface DicePoolInput {
  attribute?: StepDie;
  skill?: StepDie;
}
