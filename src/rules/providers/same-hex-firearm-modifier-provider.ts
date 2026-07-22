import type { AttackContext } from "../../combat/attack-context";
import type { RangedAttackModifierProvider } from "../../combat/ranged-attack-resolver";

export type SameHexFirearmCategory =
  | "pistol"
  | "carbine"
  | "smg"
  | "other";

export interface SameHexFirearmModifierSource {
  getWeaponCategory(
    weaponId: string,
  ): SameHexFirearmCategory;

  isTargetActiveAndAware(
    targetId: string,
  ): boolean;
}

export interface SameHexFirearmModifier {
  source: "same-hex-firearm";
  value: number;
  description: string;
}

export class SameHexFirearmModifierProvider
  implements RangedAttackModifierProvider
{
  constructor(
    private readonly source:
      SameHexFirearmModifierSource,
  ) {}

  getModifiers(
    context: AttackContext,
  ): SameHexFirearmModifier[] {
    if (
      context.combatMode !== "ranged" ||
      !context.sameHex ||
      !context.weaponId ||
      !this.source.isTargetActiveAndAware(
        context.targetId,
      )
    ) {
      return [];
    }

    const category =
      this.source.getWeaponCategory(
        context.weaponId,
      );

    const value =
      category === "pistol" ||
      category === "carbine" ||
      category === "smg"
        ? -1
        : -2;

    return [
      {
        source: "same-hex-firearm",
        value,
        description:
          "Firing at active and aware target in same hex",
      },
    ];
  }
}
