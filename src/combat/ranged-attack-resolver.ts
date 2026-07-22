import { AttackContextBuilder } from "./attack-context-builder";
import type { AttackContext } from "./attack-context";
import type {
  RangedAttackModifier,
  RangedAttackRequest,
  RangedAttackResult,
} from "./ranged-attack-types";
import { DiceModifierApplicator } from "../dice/modifier-applicator";
import { DicePool } from "../dice/pool";
import { DiceEngine } from "../dice/roller";

export interface RangedAttackModifierProvider {
  getModifiers(context: AttackContext): RangedAttackModifier[];
}

export class RangedAttackResolver {
  constructor(
    private readonly contextBuilder: AttackContextBuilder,
    private readonly modifierProviders: readonly RangedAttackModifierProvider[],
    private readonly modifierApplicator: DiceModifierApplicator,
    private readonly diceEngine: DiceEngine,
  ) {}

  async resolve(
    request: RangedAttackRequest,
  ): Promise<RangedAttackResult> {
    const context = this.contextBuilder.build({
      attackerId: request.attackerId,
      targetId: request.targetId,
      weaponId: request.weaponId,
    });

    if (context.combatMode !== "ranged") {
      throw new Error("RangedAttackResolver can only resolve ranged attacks.");
    }

    if (context.rangeBand === "out-of-range") {
      throw new Error("Target is beyond the weapon's effective range.");
    }

    const basePool = DicePool.from({
      attribute: request.baseAttributeDie,
      skill: request.baseSkillDie,
    });

    const modifiers = this.modifierProviders.flatMap(
      (provider) => provider.getModifiers(context),
    );

    const netModifier = modifiers.reduce(
      (total, modifier) => total + modifier.value,
      0,
    );

    const finalPool = this.modifierApplicator.apply(
      basePool,
      netModifier,
    );

    const roll = await this.diceEngine.roll(finalPool);

    return {
      context,
      basePool,
      modifiers,
      netModifier,
      finalPool,
      roll,
    };
  }
}
