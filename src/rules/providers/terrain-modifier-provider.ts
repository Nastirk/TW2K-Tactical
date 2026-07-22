import type {
  AttackContext,
} from "../../combat/attack-context";
import type {
  RangedAttackModifierProvider,
} from "../../combat/ranged-attack-resolver";

export interface TerrainModifier {
  source: "target-terrain";
  value: number;
  description: string;
  provenance: "automatic";
}

export class TerrainModifierProvider
  implements RangedAttackModifierProvider
{
  getModifiers(
    context: AttackContext,
  ): TerrainModifier[] {
    if (
      context.combatMode !==
        "ranged" ||
      context.sameHex
    ) {
      return [];
    }

    const value =
      context
        .targetTerrainModifier;

    if (
      value === undefined ||
      value === 0
    ) {
      return [];
    }

    return [
      {
        source:
          "target-terrain",
        value,
        description:
          context.targetTerrain
            ? `Target terrain: ${context.targetTerrain}`
            : "Target terrain",
        provenance: "automatic",
      },
    ];
  }
}
