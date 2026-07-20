import type { ModifierAwareStagedRangedCombatRequest } from "../combat/modifier-aware-staged-ranged-combat-workflow";
import type { StagedEndToEndRangedCombatRequest } from "../combat/staged-end-to-end-ranged-combat-workflow";
import type { AttackDialogInput } from "./attack-dialog-types";

export class AttackDialogRequestFactory {
  create(
    combat: StagedEndToEndRangedCombatRequest,
    input: AttackDialogInput,
  ): ModifierAwareStagedRangedCombatRequest {
    const isMachineGun =
      input.weaponCategory === "lmg" ||
      input.weaponCategory === "gpmg" ||
      input.weaponCategory === "hmg";

    const machineGunCarried =
      isMachineGun &&
      !input.bipodDeployed &&
      !input.tripodDeployed &&
      !input.vehicleMounted;

    return {
      combat: {
        ...combat,
        contextOverrides: {
          ...combat.contextOverrides,
          aimMode:
            input.aimMode,
          hasTelescopicSight:
            input.hasTelescopicSight,
          bipodDeployed:
            input.bipodDeployed,
          // Only an explicit/manual stable platform overrides automatic
          // context. Leaving this undefined allows AttackContextBuilder to
          // derive stability from the attacker being prone or a deployed bipod.
          stablePlatform: input.stablePlatform
            ? true
            : undefined,
          targetProne:
            input.targetProne,
          targetSize:
            input.targetSize,
          elevatedPosition:
            input.elevatedPosition,
          targetTerrainModifier:
            input.targetTerrainModifier,
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
        // Terrain is resolved by TerrainModifierProvider from
        // automatic context, with the dialog value preserved
        // above as an explicit override. Neutralize the legacy
        // resolver field to avoid double-counting.
        targetTerrainModifier: 0,
        lightLevel: input.lightLevel,
        weatherModifier: input.weatherModifier,
        denseSmoke: input.denseSmoke,
        hasNightVision: input.hasNightVision,
        hasThermalOptics: input.hasThermalOptics,
        machineGunCarried,
        bipodDeployed: input.bipodDeployed,
        tripodDeployed: input.tripodDeployed,
        vehicleMounted: input.vehicleMounted,
        oneHanded: input.oneHanded,
        atShortRange: input.atShortRange,
        hasTelescopicSight: input.hasTelescopicSight,
        stablePlatform:
          (input.attackerProne ?? false) ||
          input.stablePlatform ||
          input.bipodDeployed ||
          input.tripodDeployed,
      },
    };
  }
}
