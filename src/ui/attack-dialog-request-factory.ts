import type { ModifierAwareStagedRangedCombatRequest } from "../combat/modifier-aware-staged-ranged-combat-workflow";
import type { StagedEndToEndRangedCombatRequest } from "../combat/staged-end-to-end-ranged-combat-workflow";
import type { AttackDialogInput } from "./attack-dialog-types";

export class AttackDialogRequestFactory {
  create(
    combat: StagedEndToEndRangedCombatRequest,
    input: AttackDialogInput,
  ): ModifierAwareStagedRangedCombatRequest {
    return {
      combat,
      modifiers: {
        weaponCategory: input.weaponCategory,
        aimMode: input.aimMode,
        calledShot: input.calledShot,
        targetProne: input.targetProne,
        targetInFullCover: input.targetInFullCover,
        approximateTargetLocationKnown: input.approximateTargetLocationKnown,
        targetMoved: input.targetMoved,
        firingFromMovingVehicle: input.firingFromMovingVehicle,
        targetSize: input.targetSize,
        elevatedPosition: input.elevatedPosition,
        targetTerrainModifier: input.targetTerrainModifier,
        lightLevel: input.lightLevel,
        weatherModifier: input.weatherModifier,
        denseSmoke: input.denseSmoke,
        hasNightVision: input.hasNightVision,
        hasThermalOptics: input.hasThermalOptics,
        machineGunCarried: input.machineGunCarried,
        oneHanded: input.oneHanded,
        atShortRange: input.atShortRange,
        hasTelescopicSight: input.hasTelescopicSight,
        stablePlatform: input.stablePlatform,
      },
    };
  }
}
