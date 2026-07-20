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
}
