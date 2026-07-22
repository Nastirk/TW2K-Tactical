import {
  DiceModifierApplicator,
} from "../dice/modifier-applicator";
import {
  DicePool,
} from "../dice/pool";
import type {
  DicePoolResult,
} from "../dice/result";
import {
  DiceEngine,
} from "../dice/roller";
import type {
  StepDie,
} from "../dice/types";

export interface ReloadRequest {
  attributeDie?: StepDie;
  skillDie?: StepDie;
  hasReloaderSpecialty: boolean;
  hasSlowActionAvailable: boolean;
}

export interface ReloadResult {
  basePool: DicePool;
  finalPool: DicePool;
  roll: DicePoolResult;
  reloaderModifier: number;
  success: boolean;
  completed: boolean;
  actionCost?: "fast" | "slow";
}

export class ReloadResolver {
  constructor(
    private readonly diceEngine:
      DiceEngine,
    private readonly modifierApplicator:
      DiceModifierApplicator,
  ) {}

  async resolve(
    request: ReloadRequest,
  ): Promise<ReloadResult> {
    const basePool =
      DicePool.from({
        attribute:
          request.attributeDie,
        skill:
          request.skillDie,
      });
    const reloaderModifier =
      request.hasReloaderSpecialty
        ? 1
        : 0;
    const finalPool =
      this.modifierApplicator
        .apply(
          basePool,
          reloaderModifier,
        );
    const roll =
      await this.diceEngine
        .roll(finalPool);
    const success =
      roll.successes >= 1;
    const completed =
      success ||
      request
        .hasSlowActionAvailable;

    return {
      basePool,
      finalPool,
      roll,
      reloaderModifier,
      success,
      completed,
      actionCost:
        success
          ? "fast"
          : completed
          ? "slow"
          : undefined,
    };
  }
}
