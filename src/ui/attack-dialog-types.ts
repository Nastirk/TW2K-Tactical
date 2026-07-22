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
  targetInFullCover: boolean;
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
  machineGunCarried: boolean;
  oneHanded: boolean;
  atShortRange: boolean;
  hasTelescopicSight: boolean;
  stablePlatform: boolean;

  /** Omitted for legacy/untracked weapons. */
  ammoTracked?: boolean;
  ammoDice?: number;
  maxAmmoDice?: number;
  roundsRemaining?: number;
  ammoSuccessAllocation?:
    AmmoSuccessAllocation;
}
