import type {
  AttackContext,
} from "../../combat/attack-context";
import type {
  RangedAttackModifierProvider,
} from "../../combat/ranged-attack-resolver";

export interface TargetProneModifier {
  source: "target-prone";
  value: -1;
  description: string;
}

export class TargetProneModifierProvider
  implements RangedAttackModifierProvider
{
  getModifiers(
    context: AttackContext,
  ): TargetProneModifier[] {
    if (
      context.combatMode !== "ranged" ||
      context.targetProne !== true ||
      context.sameHex
    ) {
      return [];
    }

    return [
      {
        source: "target-prone",
        value: -1,
        description: "Target prone",
      },
    ];
  }
}
