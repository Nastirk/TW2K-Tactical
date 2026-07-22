import type {
  Modifier,
} from "./modifier";

export type RangedWeaponCategory =
  | "pistol"
  | "carbine"
  | "smg"
  | "rifle"
  | "assault-rifle"
  | "lmg"
  | "gpmg"
  | "hmg"
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
  weaponCategory:
    RangedWeaponCategory;

  aimMode?: AimMode;

  hasTelescopicSight?: boolean;
  stablePlatform?: boolean;

  targetProne?: boolean;
  sameHex?: boolean;

  targetInFullCover?: boolean;
  approximateTargetLocationKnown?: boolean;

  calledShot?: boolean;
  targetMoved?: boolean;
  firingFromMovingVehicle?: boolean;

  targetSize?: TargetSize;
  elevatedPosition?: boolean;

  /**
   * Terrain modifier from the target hex.
   * Expected values are 0, -1, or -2.
   */
  targetTerrainModifier?: number;

  lightLevel?: LightLevel;

  /**
   * Weather modifier, typically -1 but the Referee may set a larger penalty.
   */
  weatherModifier?: number;

  denseSmoke?: boolean;

  hasNightVision?: boolean;
  hasThermalOptics?: boolean;

  machineGunCarried?: boolean;
  oneHanded?: boolean;

  /**
   * Needed for the rule that rifles and assault rifles may only
   * be fired one-handed at SHORT range.
   */
  atShortRange?: boolean;
}

export interface RangedCombatModifierResolution {
  attackAllowed: boolean;
  blockedReason?: string;
  modifiers: Modifier[];
  netModifier: number;

  /**
   * Slow telescopic aim forbids ammo dice.
   */
  ammoDiceAllowed: boolean;
}
