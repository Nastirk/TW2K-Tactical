import type {
  Modifier,
} from "./modifier";

export type RangedWeaponCategory =
  | "pistol"
  | "carbine"
  | "smg"
  | "shotgun"
  | "rifle"
  | "assault-rifle"
  | "sniper-rifle"
  | "hunting-rifle"
  | "bow"
  | "crossbow"
  | "lmg"
  | "gpmg"
  | "hmg"
  | "grenade-launcher"
  | "missile-launcher"
  | "mortar"
  | "howitzer"
  | "vehicle-cannon"
  | "other";

export type AimMode =
  | "quick"
  | "fast"
  | "slow";

export type TargetSize =
  | "normal"
  | "large"
  | "small";

export type LightLevel =
  | "normal"
  | "dim"
  | "dark"
  | "total-darkness";

export interface RangedCombatModifierInput {
  weaponCategory: RangedWeaponCategory;

  aimMode?: AimMode;
  hasTelescopicSight?: boolean;
  stablePlatform?: boolean;

  targetProne?: boolean;
  targetDefenseless?: boolean;
  sameHex?: boolean;

  targetInFullCover?: boolean;
  targetInPartialCover?: boolean;
  coverEffectiveAgainstAttacker?: boolean;
  targetCoverArmorLevel?: number;
  approximateTargetLocationKnown?: boolean;

  calledShot?: boolean;
  targetMoved?: boolean;
  firingFromMovingVehicle?: boolean;

  targetSize?: TargetSize;
  elevatedPosition?: boolean;

  /** Terrain modifier from the target hex. Expected values: 0, -1, -2. */
  targetTerrainModifier?: number;

  lightLevel?: LightLevel;
  weatherModifier?: number;
  denseSmoke?: boolean;
  hasNightVision?: boolean;
  hasThermalOptics?: boolean;
  visibilityLimitHexes?: number;
  distanceHexes?: number;
  lineOfSightBlocked?: boolean;
  lineOfSightBlockReason?: string;

  helperCount?: number;

  machineGunCarried?: boolean;
  bipodDeployed?: boolean;
  tripodDeployed?: boolean;
  vehicleMounted?: boolean;
  oneHanded?: boolean;

  /** Needed for one-handed rifle/assault-rifle SHORT-range restriction. */
  atShortRange?: boolean;
}

export interface RangedCombatModifierResolution {
  attackAllowed: boolean;
  blockedReason?: string;
  modifiers: Modifier[];
  netModifier: number;

  /** Slow telescopic aim forbids ammo dice. */
  ammoDiceAllowed: boolean;
}
