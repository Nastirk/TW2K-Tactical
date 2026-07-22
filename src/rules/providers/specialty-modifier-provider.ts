import type { AttackContext } from "../../combat/attack-context";
import type { RangedAttackModifierProvider } from "../../combat/ranged-attack-resolver";
import type { RangedWeaponCategory } from "../ranged-combat-modifier-types";

export interface CombatSpecialtyModifierSource {
  getWeaponCategory(weaponId: string): RangedWeaponCategory;
  hasAttackerSpecialty(attackerId: string, specialtyName: string): boolean;
}

interface SpecialtyRule {
  name: string;
  categories: readonly RangedWeaponCategory[];
}

const RULES: readonly SpecialtyRule[] = [
  {
    name: "Rifleman",
    categories: ["assault-rifle", "carbine", "smg", "shotgun"],
  },
  {
    name: "Sidearms",
    categories: ["pistol"],
  },
  {
    name: "Sniper",
    categories: ["sniper-rifle", "hunting-rifle"],
  },
  {
    name: "Archer",
    categories: ["bow", "crossbow"],
  },
  {
    name: "Machinegunner",
    categories: ["lmg", "gpmg", "hmg"],
  },
  {
    name: "Launcher Crew",
    categories: ["grenade-launcher", "missile-launcher"],
  },
  {
    name: "Redleg",
    categories: ["mortar", "howitzer"],
  },
  {
    name: "Vehicle Gunner",
    categories: ["vehicle-cannon"],
  },
];

export class SpecialtyModifierProvider
  implements RangedAttackModifierProvider
{
  constructor(
    private readonly source: CombatSpecialtyModifierSource,
  ) {}

  getModifiers(context: AttackContext) {
    if (
      context.combatMode !== "ranged" ||
      !context.weaponId
    ) {
      return [];
    }

    const category = this.source.getWeaponCategory(context.weaponId);
    const rule = RULES.find(
      (candidate) =>
        candidate.categories.includes(category) &&
        this.source.hasAttackerSpecialty(
          context.attackerId,
          candidate.name,
        ),
    );

    if (!rule) {
      return [];
    }

    return [
      {
        source: "specialty",
        value: 1,
        description: `${rule.name} specialty`,
        provenance: "automatic" as const,
      },
    ];
  }
}
