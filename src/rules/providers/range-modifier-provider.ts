import type { AttackContext, RangeBand } from "../../combat/attack-context";
import { getShotgunRangeDamageReduction } from "../../combat/shotgun-range";
import type { RangedAttackModifierProvider } from "../../combat/ranged-attack-resolver";

export interface RangeModifier {
  source: "range";
  value: number;
  description: string;
}

export type RangeModifierValues =
  Record<Exclude<RangeBand, "out-of-range">, number>;

export class RangeModifierProvider
  implements RangedAttackModifierProvider
{
  constructor(
    private readonly values: RangeModifierValues = {
      short: 0,
      medium: -1,
      long: -2,
      extreme: -3,
    },
  ) {}

  getModifiers(
    context: AttackContext,
  ): RangeModifier[] {
    if (context.combatMode !== "ranged") {
      return [];
    }

    if (!context.rangeBand) {
      return [];
    }

    if (context.rangeBand === "out-of-range") {
      return [];
    }

    if (
      context.usesShotgunRangeRules
    ) {
      const damageReduction =
        getShotgunRangeDamageReduction(
          context.rangeBand,
        );

      return [
        {
          source: "range",
          value: 0,
          description:
            damageReduction > 0
              ? `Shotgun range: ${context.rangeBand} (no hit penalty; base damage -${damageReduction})`
              : `Shotgun range: ${context.rangeBand} (no hit penalty)`,
        },
      ];
    }

    return [
      {
        source: "range",
        value: this.values[context.rangeBand],
        description: `Range: ${context.rangeBand}`,
      },
    ];
  }

}
