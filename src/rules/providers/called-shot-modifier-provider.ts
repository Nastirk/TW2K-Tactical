import type { AttackContext } from "../../combat/attack-context";
import type { RangedAttackModifierProvider } from "../../combat/ranged-attack-resolver";

export class CalledShotModifierProvider
  implements RangedAttackModifierProvider
{
  getModifiers(context: AttackContext) {
    if (
      context.combatMode !== "ranged" ||
      context.calledShot !== true
    ) {
      return [];
    }

    return [
      {
        source: "called-shot",
        value: -2,
        description: "Called shot",
        provenance: "input" as const,
      },
    ];
  }
}
