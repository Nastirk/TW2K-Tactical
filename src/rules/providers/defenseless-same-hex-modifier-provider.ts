import type { AttackContext } from "../../combat/attack-context";
import type { RangedAttackModifierProvider } from "../../combat/ranged-attack-resolver";

export class DefenselessSameHexModifierProvider
  implements RangedAttackModifierProvider
{
  getModifiers(context: AttackContext) {
    if (
      context.combatMode !== "ranged" ||
      !context.sameHex ||
      context.targetDefenseless !== true
    ) {
      return [];
    }

    return [
      {
        source: "defenseless-same-hex",
        value: 3,
        description: "Defenseless target in same hex",
        provenance: "automatic" as const,
      },
    ];
  }
}
