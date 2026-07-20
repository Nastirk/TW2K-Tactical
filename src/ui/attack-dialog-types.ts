import type {
  AimMode,
  LightLevel,
  RangedWeaponCategory,
  TargetSize,
} from "../rules/ranged-combat-modifier-types";

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
  /** Automatic shooter stance captured when the dialog opens. */
  attackerProne?: boolean;
  hasBipod: boolean;
  bipodDeployed: boolean;
  hasTripod: boolean;
  tripodDeployed: boolean;
  vehicleMounted: boolean;
  stablePlatform: boolean;
}
