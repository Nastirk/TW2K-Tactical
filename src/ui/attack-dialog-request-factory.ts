import type { ModifierAwareStagedRangedCombatRequest } from "../combat/modifier-aware-staged-ranged-combat-workflow";
import type { StagedEndToEndRangedCombatRequest } from "../combat/staged-end-to-end-ranged-combat-workflow";
import type { AttackDialogInput } from "./attack-dialog-types";

export class AttackDialogRequestFactory {
  create(
    combat: StagedEndToEndRangedCombatRequest,
    input: AttackDialogInput,
  ): ModifierAwareStagedRangedCombatRequest {
    return {
      combat: {
        ...combat,
        contextOverrides: {
          ...combat.contextOverrides,
          targetProne:
            input.targetProne,
          targetSize:
            input.targetSize,
          elevatedPosition:
            input.elevatedPosition,
        },
      },
      modifiers: {
        weaponCategory: input.weaponCategory,
        aimMode: input.aimMode,
        calledShot: input.calledShot,

        // These three facts are now resolved by automatic
        // AttackContext modifier providers. Neutralize the
        // legacy monolithic resolver fields so they are not
        // counted twice. The dialog values are preserved above
        // as explicit context overrides.
        targetProne: false,
        targetSize: "normal",
        elevatedPosition: false,

        targetInFullCover: input.targetInFullCover,
        approximateTargetLocationKnown: input.approximateTargetLocationKnown,
        targetMoved: input.targetMoved,
        firingFromMovingVehicle: input.firingFromMovingVehicle,
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
