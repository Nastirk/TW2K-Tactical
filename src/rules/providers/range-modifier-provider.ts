import type { AttackContext, RangeBand } from "../../combat/attack-context";
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

    return [
      {
        source: "range",
        value: this.values[context.rangeBand],
        description: `Range: ${context.rangeBand}`,
      },
    ];
  }
}
