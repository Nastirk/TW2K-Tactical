import type { AttackContext } from "../../combat/attack-context";
import type { RangedAttackModifierProvider } from "../../combat/ranged-attack-resolver";

export class TargetMovementModifierProvider
  implements RangedAttackModifierProvider
{
  getModifiers(context: AttackContext) {
    if (
      context.combatMode !== "ranged" ||
      context.targetMoved !== true
    ) {
      return [];
    }

    return [
      {
        source: "moving-target",
        value: -1,
        description: "Target moved since previous turn",
        provenance: "inferred" as const,
      },
    ];
  }
}
