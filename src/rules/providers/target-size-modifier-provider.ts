import type {
  AttackContext,
} from "../../combat/attack-context";
import type {
  RangedAttackModifierProvider,
} from "../../combat/ranged-attack-resolver";

export interface TargetSizeModifier {
  source: "target-size";
  value: number;
  description: string;
}

export class TargetSizeModifierProvider
  implements RangedAttackModifierProvider
{
  getModifiers(
    context: AttackContext,
  ): TargetSizeModifier[] {
    if (
      context.combatMode !== "ranged"
    ) {
      return [];
    }

    if (
      context.targetSize === "large"
    ) {
      return [
        {
          source: "target-size",
          value: 2,
          description: "Large target",
        },
      ];
    }

    if (
      context.targetSize === "small"
    ) {
      return [
        {
          source: "target-size",
          value: -2,
          description: "Small target",
        },
      ];
    }

    return [];
  }
}
