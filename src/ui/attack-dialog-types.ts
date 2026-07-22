import type {
  AimMode,
  LightLevel,
  RangedWeaponCategory,
  TargetSize,
} from "../rules/ranged-combat-modifier-types";
import type {
  AmmoSuccessAllocation,
} from "../combat/ammo-resolver";

export interface AttackDialogInput {
  weaponCategory: RangedWeaponCategory;
  aimMode: AimMode;
  calledShot: boolean;
  targetProne: boolean;
  targetDefenseless?: boolean;
  targetInFullCover: boolean;
  targetInPartialCover?: boolean;
  coverEffectiveAgainstAttacker?: boolean;
  targetCoverArmorLevel?: number;
  approximateTargetLocationKnown: boolean;
  targetMoved: boolean;
  firingFromMovingVehicle: boolean;
  targetSize: TargetSize;
  elevatedPosition: boolean;
  targetTerrainModifier: number;
  lightLevel: LightLevel;
  weatherModifier: number;
  denseSmoke: boolean;
  hasNightVision: boolean;
  hasThermalOptics: boolean;
  visibilityLimitHexes?: number;
  lineOfSightBlocked?: boolean;
  lineOfSightBlockReason?: string;
  helperCount?: number;
  machineGunCarried: boolean;
  oneHanded: boolean;
  atShortRange: boolean;
  distanceHexes?: number;
  hasTelescopicSight: boolean;
  /** Automatic shooter stance captured when the dialog opens. */
  attackerProne?: boolean;
  hasBipod: boolean;
  bipodDeployed: boolean;
  hasTripod: boolean;
  tripodDeployed: boolean;
  vehicleMounted: boolean;
  stablePlatform: boolean;

  /** Omitted for legacy/untracked weapons. */
  ammoTracked?: boolean;
  ammoDice?: number;
  maxAmmoDice?: number;
  roundsRemaining?: number;
  ammoSuccessAllocation?:
    AmmoSuccessAllocation;
}
