import type {
  TerrainType,
  TerrainVisibility,
} from "./terrain";

export type RangeBand =
  | "short"
  | "medium"
  | "long"
  | "extreme"
  | "out-of-range";

export type CombatMode =
  | "ranged"
  | "close-combat";

export type TargetSizeCategory =
  | "small"
  | "normal"
  | "large";

export interface AttackContextOverrides {
  targetProne?: boolean;
  targetSize?: TargetSizeCategory;
  elevatedPosition?: boolean;
  targetTerrainModifier?: number;
}

export interface AttackContext {
  attackerId: string;
  targetId: string;
  weaponId?: string;

  distanceHexes: number;
  combatMode: CombatMode;
  rangeBand?: RangeBand;
  sameHex: boolean;

  /**
   * Automatically observed combat-state facts.
   *
   * These remain optional on the public context contract
   * for backward compatibility. AttackContextBuilder supplies
   * neutral defaults when automatic readers are unavailable.
   */
  targetProne?: boolean;
  targetSize?: TargetSizeCategory;
  elevatedPosition?: boolean;

  /**
   * True when the selected weapon follows the core shotgun rule:
   * range does not penalize the attack roll, but reduces base damage.
   */
  usesShotgunRangeRules?: boolean;

  targetTerrain?: TerrainType;
  targetTerrainModifier?: number;
  targetTerrainCoverArmorLevel?:
    number | null;
  targetTerrainVisibilityHexes?:
    TerrainVisibility;
  targetTerrainBlocking?: boolean;
}
