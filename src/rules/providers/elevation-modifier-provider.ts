import type {
  AttackContext,
} from "../../combat/attack-context";
import type {
  RangedAttackModifierProvider,
} from "../../combat/ranged-attack-resolver";

export interface ElevationModifier {
  source: "elevation";
  value: 1;
  description: string;
  provenance: "automatic";
}

export class ElevationModifierProvider
  implements RangedAttackModifierProvider
{
  getModifiers(
    context: AttackContext,
  ): ElevationModifier[] {
    if (
      context.combatMode !== "ranged" ||
      context.elevatedPosition !== true
    ) {
      return [];
    }

    return [
      {
        source: "elevation",
        value: 1,
        description:
          "Elevated firing position",
        provenance: "automatic",
      },
    ];
  }
}
