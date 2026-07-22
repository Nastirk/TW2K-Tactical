import {
  buildCombatChatContextEvidence,
} from "./combat-chat-context-evidence";
import type {
  ActorCombatState,
} from "../combat/actor-combat-state";
import type {
  EndToEndRangedCombatResult,
} from "../combat/end-to-end-ranged-combat-workflow";
import type {
  CombatChatCardViewModel,
} from "./combat-chat-card-types";

export interface CombatChatNames {
  attackerName: string;
  targetName: string;
  weaponName: string;
}

export class CombatChatCardViewModelFactory {
  create(
    result:
      EndToEndRangedCombatResult,
    names:
      CombatChatNames,
    targetActorId?: string,
    targetState?:
      ActorCombatState,
  ): CombatChatCardViewModel {
    return {
      title:
        "TW2K Tactical Attack",

      attackerName:
        names.attackerName,

      targetName:
        names.targetName,

      weaponName:
        names.weaponName,

      evidence:
        buildCombatChatContextEvidence(
          result.attack.context,
        ),

      modifiers:
        result.attack.modifiers.map(
          (modifier) => ({
            source:
              modifier.source,
            value:
              modifier.value,
            description:
              modifier.description,
            provenance:
              modifier.provenance,
          }),
        ),

      netModifier:
        result.attack.netModifier,

      baseDice:
        result.attack.basePool.dice.map(
          (sides) => ({
            sides,
          }),
        ),

      finalDice:
        result.attack.finalPool.dice.map(
          (sides) => ({
            sides,
          }),
        ),

      rolledDice:
        result.attack.roll.rolls.map(
          (roll) => ({
            sides:
              roll.sides,
            value:
              roll.value,
          }),
        ),

      successes:
        result.attack.roll.successes,

      hit:
        result.hit,

      hitLocation:
        result.postHit?.location,

      damageBeforeArmor:
        result.postHit
          ?.damage
          .damageBeforeArmor,

      modifiedArmorLevel:
        result.postHit
          ?.armor
          .modifiedArmorLevel,

      finalDamage:
        result.postHit
          ?.finalDamage,

      critical:
        result.criticalInjury
          ? {
              injury:
                result
                  .criticalInjury
                  .injury
                  .injury,

              lethal:
                result
                  .criticalInjury
                  .injury
                  .lethal,

              timeLimit:
                result
                  .criticalInjury
                  .injury
                  .timeLimit,

              effects: [
                ...result
                  .criticalInjury
                  .injury
                  .effects,
              ],

              healTime:
                result
                  .criticalInjury
                  .injury
                  .healTime,

              instantDeath:
                Boolean(
                  result
                    .criticalInjury
                    .injury
                    .instantDeath,
                ),
            }
          : undefined,

      deathSaveStatus:
        targetState
          ?.deathSaveState
          ?.status,

      deathSaveTimeLimit:
        targetState
          ?.deathSaveState
          ?.timeLimit,

      targetActorId,

      canApplyResult:
        Boolean(
          targetActorId,
        ) &&
        result.hit,
    };
  }
}
