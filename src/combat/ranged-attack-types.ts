import type { AttackContext } from "./attack-context";
import type { AttackRequest } from "./attack-request";
import type { DicePool } from "../dice/pool";
import type { DicePoolResult } from "../dice/result";
import type { StepDie } from "../dice/types";

export interface RangedAttackModifier {
  source: string;
  value: number;
  description: string;
}

export interface RangedAttackRequest
  extends AttackRequest {
  weaponId: string;
  baseAttributeDie?: StepDie;
  baseSkillDie?: StepDie;
}

export interface RangedAttackResult {
  context: AttackContext;
  basePool: DicePool;
  modifiers: RangedAttackModifier[];
  netModifier: number;
  finalPool: DicePool;
  roll: DicePoolResult;
}
