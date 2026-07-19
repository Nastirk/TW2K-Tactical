import type {
  T2K4EItemLike,
} from "./t2k4e-types";
import {
  readInteger,
} from "./t2k4e-path-reader";

export interface T2KWeaponProfile {
  weaponId: string;
  baseDamage: number;
  critThreshold: number;
  armorModifier: number;
  shortRangeHexes: number;
}

export class T2K4EWeaponAdapter {
  constructor(
    private readonly item:
      T2K4EItemLike,
  ) {
    if (
      item.type !== "weapon"
    ) {
      throw new Error(
        `Expected a weapon item, got "${item.type}".`,
      );
    }
  }

  toProfile():
    T2KWeaponProfile {
    return {
      weaponId:
        this.item.id,

      baseDamage:
        readInteger(
          this.item,
          [
            "system.damage",
            "system.damage.value",
            "system.baseDamage",
          ],
          "weapon base damage",
        ),

      critThreshold:
        readInteger(
          this.item,
          [
            "system.crit",
            "system.critThreshold",
            "system.critical",
          ],
          "weapon crit threshold",
        ),

      armorModifier:
        readInteger(
          this.item,
          [
            "system.armorModifier",
            "system.armourModifier",
            "system.armorMod",
          ],
          "weapon armor modifier",
        ),

      shortRangeHexes:
        readInteger(
          this.item,
          [
            "system.range",
            "system.range.short",
            "system.shortRange",
          ],
          "weapon short range",
        ),
    };
  }
}
