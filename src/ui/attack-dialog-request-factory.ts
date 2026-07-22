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

    const visibilityLimitHexes = input.visibilityLimitHexes ?? 0;
    const visibilityBlocked =
      !input.hasThermalOptics &&
      visibilityLimitHexes > 0 &&
      (input.distanceHexes ?? 0) > visibilityLimitHexes;

    const ammunition =
      combat.ammunition
        ? {
            ...combat.ammunition,
            ammoDice:
              input.ammoDice ?? 0,
            allocation:
              input
                .ammoSuccessAllocation ??
              "damage" as const,
            slowAim:
              input.aimMode ===
              "slow",
          }
        : undefined;

    return {
      combat: {
        ...combat,
        contextOverrides: {
          ...combat.contextOverrides,
          aimMode: input.aimMode,
          hasTelescopicSight: input.hasTelescopicSight,
          bipodDeployed: input.bipodDeployed,
          stablePlatform: input.stablePlatform ? true : undefined,
          calledShot: input.calledShot,
          targetProne: input.targetProne,
          targetDefenseless: input.targetDefenseless ?? false,
          targetSize: input.targetSize,
          elevatedPosition: input.elevatedPosition,
          targetTerrainModifier: input.targetTerrainModifier,
          targetInFullCover: input.targetInFullCover,
          targetInPartialCover: input.targetInPartialCover ?? false,
          coverEffectiveAgainstAttacker:
            input.coverEffectiveAgainstAttacker ?? false,
          targetCoverArmorLevel: input.targetCoverArmorLevel ?? 0,
          approximateTargetLocationKnown:
            input.approximateTargetLocationKnown,
          targetMoved: input.targetMoved,
          firingFromMovingVehicle: input.firingFromMovingVehicle,
          lightLevel: input.lightLevel,
          weatherModifier: input.weatherModifier,
          denseSmoke: input.denseSmoke,
          hasNightVision: input.hasNightVision,
          hasThermalOptics: input.hasThermalOptics,
          visibilityLimitHexes,
          lineOfSightBlocked:
            (input.lineOfSightBlocked ?? false) || visibilityBlocked,
          helperCount: input.helperCount ?? 0,
        },
        ...(ammunition
          ? { ammunition }
          : {}),
      },
      modifiers: {
        weaponCategory: input.weaponCategory,
        aimMode: input.aimMode,

        // Provider-owned modifiers are neutralized here to prevent double
        // counting. Their selected/automatic facts are carried in context.
        calledShot: false,
        targetProne: false,
        targetDefenseless: false,
        targetMoved: false,
        firingFromMovingVehicle: false,
        targetSize: "normal",
        elevatedPosition: false,
        targetTerrainModifier: 0,
        helperCount: 0,

        targetInFullCover: input.targetInFullCover,
        targetInPartialCover: input.targetInPartialCover ?? false,
        coverEffectiveAgainstAttacker:
          input.coverEffectiveAgainstAttacker ?? false,
        targetCoverArmorLevel: input.targetCoverArmorLevel ?? 0,
        approximateTargetLocationKnown:
          input.approximateTargetLocationKnown,

        lightLevel: input.lightLevel,
        weatherModifier: input.weatherModifier,
        denseSmoke: input.denseSmoke,
        hasNightVision: input.hasNightVision,
        hasThermalOptics: input.hasThermalOptics,
        visibilityLimitHexes,
        distanceHexes: input.distanceHexes ?? 0,
        lineOfSightBlocked:
          (input.lineOfSightBlocked ?? false) || visibilityBlocked,
        lineOfSightBlockReason: input.lineOfSightBlockReason,

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
