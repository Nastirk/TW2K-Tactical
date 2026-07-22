import type { AttackContext } from "../../combat/attack-context";
import type { RangedAttackModifierProvider } from "../../combat/ranged-attack-resolver";

export class HelperModifierProvider
  implements RangedAttackModifierProvider
{
  getModifiers(context: AttackContext) {
    if (
      context.combatMode !== "ranged" ||
      !context.helperCount
    ) {
      return [];
    }

    const count = Math.max(0, Math.min(3, context.helperCount));
    if (count === 0) {
      return [];
    }

    return [
      {
        source: "helpers",
        value: count,
        description:
          count === 1
            ? "Help from 1 ally"
            : `Help from ${count} allies`,
        provenance: "input" as const,
      },
    ];
  }
}
