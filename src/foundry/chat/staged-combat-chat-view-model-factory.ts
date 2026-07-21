import {
  buildCombatChatContextEvidence,
} from "../../ui/combat-chat-context-evidence";
import type {
  StagedEndToEndRangedCombatResult,
} from "../../combat/staged-end-to-end-ranged-combat-workflow";
import type {
  CombatChatCardViewModel,
} from "../../ui/combat-chat-card-types";
import type {
  CombatChatNames,
} from "../../ui/combat-chat-card-view-model-factory";

export class StagedCombatChatViewModelFactory {
  create(
    result:
      StagedEndToEndRangedCombatResult,
    names:
      CombatChatNames,
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
        result
          .deathSaveState
          ?.status,

      deathSaveTimeLimit:
        result
          .deathSaveState
          ?.timeLimit,

      targetActorId:
        result.targetActorId,

      canApplyResult:
        result.hit,
    };
  }
}
