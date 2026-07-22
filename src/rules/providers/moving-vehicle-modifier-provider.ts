import type { AttackContext } from "../../combat/attack-context";
import type { RangedAttackModifierProvider } from "../../combat/ranged-attack-resolver";

export class MovingVehicleModifierProvider
  implements RangedAttackModifierProvider
{
  getModifiers(context: AttackContext) {
    if (
      context.combatMode !== "ranged" ||
      context.firingFromMovingVehicle !== true
    ) {
      return [];
    }

    return [
      {
        source: "moving-vehicle",
        value: -2,
        description: "Firing from moving vehicle",
        provenance: "inferred" as const,
      },
    ];
  }
}
