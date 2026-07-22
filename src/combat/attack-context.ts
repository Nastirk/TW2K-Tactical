import type {
  AimMode,
  LightLevel,
} from "../rules/ranged-combat-modifier-types";
import type {
  TerrainType,
  TerrainVisibility,
} from "./terrain";
import type {
  T2KCombatGridEvidence,
} from "./t2k-combat-grid";

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

/**
 * Explicit choices and corrections supplied by the attack workflow.
 * Automatic Foundry readers remain the default source of truth when an
 * override is omitted.
 */
export interface AttackContextOverrides {
  aimMode?: AimMode;
  hasTelescopicSight?: boolean;
  bipodDeployed?: boolean;
  stablePlatform?: boolean;

  calledShot?: boolean;
  targetProne?: boolean;
  targetDefenseless?: boolean;
  targetSize?: TargetSizeCategory;
  elevatedPosition?: boolean;
  targetTerrainModifier?: number;

  targetInFullCover?: boolean;
  targetInPartialCover?: boolean;
  coverEffectiveAgainstAttacker?: boolean;
  targetCoverArmorLevel?: number;
  approximateTargetLocationKnown?: boolean;

  targetMoved?: boolean;
  firingFromMovingVehicle?: boolean;

  lightLevel?: LightLevel;
  weatherModifier?: number;
  denseSmoke?: boolean;
  hasNightVision?: boolean;
  hasThermalOptics?: boolean;
  visibilityLimitHexes?: number;
  lineOfSightBlocked?: boolean;
  lineOfSightBlockReason?: string;

  helperCount?: number;
}

export interface AttackContext {
  attackerId: string;
  targetId: string;
  weaponId?: string;

  distanceHexes: number;
  combatMode: CombatMode;
  rangeBand?: RangeBand;
  sameHex: boolean;
  combatGridEvidence?: T2KCombatGridEvidence;

  /** Automatically observed or explicitly overridden combat facts. */
  attackerProne?: boolean;
  aimMode?: AimMode;
  hasTelescopicSight?: boolean;
  hasBipod?: boolean;
  bipodDeployed?: boolean;
  stablePlatform?: boolean;

  calledShot?: boolean;
  targetProne?: boolean;
  targetDefenseless?: boolean;
  targetSize?: TargetSizeCategory;
  elevatedPosition?: boolean;

  targetInFullCover?: boolean;
  targetInPartialCover?: boolean;
  coverEffectiveAgainstAttacker?: boolean;
  targetCoverArmorLevel?: number;
  approximateTargetLocationKnown?: boolean;

  targetMoved?: boolean;
  firingFromMovingVehicle?: boolean;

  lightLevel?: LightLevel;
  weatherModifier?: number;
  denseSmoke?: boolean;
  hasNightVision?: boolean;
  hasThermalOptics?: boolean;
  visibilityLimitHexes?: number;
  lineOfSightBlocked?: boolean;
  lineOfSightBlockReason?: string;

  helperCount?: number;

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
