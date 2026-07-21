import type {
  AttackContext,
  CombatMode,
  RangeBand,
  TargetSizeCategory,
} from "./attack-context";
import {
  getTerrainProfile,
} from "./terrain";
import type {
  TerrainType,
} from "./terrain";
import type {
  AttackRequest,
} from "./attack-request";
import type {
  LightLevel,
} from "../rules/ranged-combat-modifier-types";
import type {
  T2KCombatGridEvidence,
} from "./t2k-combat-grid";

export interface AttackContextDataSource {
  getDistanceHexes(
    attackerId: string,
    targetId: string,
  ): number;

  getCombatGridEvidence?(
    attackerId: string,
    targetId: string,
  ): T2KCombatGridEvidence | undefined;

  getCombatMode(
    request: AttackRequest,
    distanceHexes: number,
  ): CombatMode;

  getRangeBand(
    weaponId: string,
    distanceHexes: number,
  ): RangeBand;

  isAttackerProne?(attackerId: string): boolean;
  isTargetProne?(targetId: string): boolean;
  isTargetDefenseless?(targetId: string): boolean;
  getTargetSize?(targetId: string): TargetSizeCategory;
  isAttackerElevated?(attackerId: string, targetId: string): boolean;
  getTargetTerrain?(targetId: string): TerrainType | undefined;

  isTargetInFullCover?(targetId: string): boolean;
  isTargetInPartialCover?(targetId: string): boolean;
  isCoverEffectiveAgainstAttacker?(attackerId: string, targetId: string): boolean;
  getTargetCoverArmorLevel?(targetId: string): number | undefined;

  didTargetMove?(targetId: string): boolean;
  isFiringFromMovingVehicle?(attackerId: string): boolean;

  getLightLevel?(attackerId: string, targetId: string): LightLevel;
  getWeatherModifier?(): number;
  hasDenseSmoke?(attackerId: string, targetId: string): boolean;
  hasNightVision?(attackerId: string, distanceHexes: number): boolean;
  hasThermalOptics?(attackerId: string): boolean;
  getVisibilityLimitHexes?(): number | undefined;
  isLineOfSightBlocked?(attackerId: string, targetId: string): boolean;
  getLineOfSightBlockReason?(attackerId: string, targetId: string): string | undefined;

  getHelperCount?(attackerId: string): number;

  hasTelescopicSight?(weaponId: string): boolean;
  hasBipod?(weaponId: string): boolean;
  usesShotgunRangeRules?(weaponId: string): boolean;
}

export class AttackContextBuilder {
  constructor(
    private readonly dataSource:
      AttackContextDataSource,
  ) {}

  build(
    request: AttackRequest,
  ): AttackContext {
    const distanceHexes =
      this.dataSource.getDistanceHexes(
        request.attackerId,
        request.targetId,
      );

    const combatGridEvidence =
      this.dataSource.getCombatGridEvidence?.(
        request.attackerId,
        request.targetId,
      );

    const combatMode =
      this.dataSource.getCombatMode(
        request,
        distanceHexes,
      );

    const sameHex = distanceHexes === 0;

    let rangeBand: RangeBand | undefined;
    if (combatMode === "ranged" && request.weaponId) {
      rangeBand = this.dataSource.getRangeBand(
        request.weaponId,
        distanceHexes,
      );
    }

    const overrides = request.contextOverrides;

    const attackerProne =
      this.dataSource.isAttackerProne?.(
        request.attackerId,
      ) ?? false;

    const aimMode = overrides?.aimMode ?? "quick";

    const hasTelescopicSight =
      overrides?.hasTelescopicSight ??
      (request.weaponId
        ? this.dataSource.hasTelescopicSight?.(request.weaponId) ?? false
        : false);

    const hasBipod =
      request.weaponId
        ? this.dataSource.hasBipod?.(request.weaponId) ?? false
        : false;

    const bipodDeployed = overrides?.bipodDeployed ?? false;
    const stablePlatform =
      overrides?.stablePlatform ??
      (attackerProne || (hasBipod && bipodDeployed));

    const calledShot = overrides?.calledShot ?? false;
    const targetProne =
      overrides?.targetProne ??
      this.dataSource.isTargetProne?.(request.targetId) ??
      false;
    const targetDefenseless =
      overrides?.targetDefenseless ??
      this.dataSource.isTargetDefenseless?.(request.targetId) ??
      false;
    const targetSize =
      overrides?.targetSize ??
      this.dataSource.getTargetSize?.(request.targetId) ??
      "normal";
    const elevatedPosition =
      overrides?.elevatedPosition ??
      this.dataSource.isAttackerElevated?.(
        request.attackerId,
        request.targetId,
      ) ??
      false;

    const targetTerrain =
      this.dataSource.getTargetTerrain?.(request.targetId);
    const terrainProfile =
      targetTerrain ? getTerrainProfile(targetTerrain) : undefined;
    const targetTerrainModifier =
      overrides?.targetTerrainModifier ??
      terrainProfile?.rangedAttackModifier ??
      undefined;

    const targetInFullCover =
      overrides?.targetInFullCover ??
      this.dataSource.isTargetInFullCover?.(request.targetId) ??
      false;
    const targetInPartialCover =
      overrides?.targetInPartialCover ??
      this.dataSource.isTargetInPartialCover?.(request.targetId) ??
      false;
    const coverEffectiveAgainstAttacker =
      overrides?.coverEffectiveAgainstAttacker ??
      this.dataSource.isCoverEffectiveAgainstAttacker?.(
        request.attackerId,
        request.targetId,
      ) ??
      false;
    const targetCoverArmorLevel =
      overrides?.targetCoverArmorLevel ??
      this.dataSource.getTargetCoverArmorLevel?.(request.targetId) ??
      terrainProfile?.coverArmorLevel ??
      undefined;
    const approximateTargetLocationKnown =
      overrides?.approximateTargetLocationKnown ?? false;

    const targetMoved =
      overrides?.targetMoved ??
      this.dataSource.didTargetMove?.(request.targetId) ??
      false;
    const firingFromMovingVehicle =
      overrides?.firingFromMovingVehicle ??
      this.dataSource.isFiringFromMovingVehicle?.(request.attackerId) ??
      false;

    const lightLevel =
      overrides?.lightLevel ??
      this.dataSource.getLightLevel?.(
        request.attackerId,
        request.targetId,
      ) ??
      "normal";
    const weatherModifier =
      overrides?.weatherModifier ??
      this.dataSource.getWeatherModifier?.() ??
      0;
    const denseSmoke =
      overrides?.denseSmoke ??
      this.dataSource.hasDenseSmoke?.(
        request.attackerId,
        request.targetId,
      ) ??
      false;
    const hasThermalOptics =
      overrides?.hasThermalOptics ??
      this.dataSource.hasThermalOptics?.(request.attackerId) ??
      false;
    const hasNightVision =
      overrides?.hasNightVision ??
      this.dataSource.hasNightVision?.(
        request.attackerId,
        distanceHexes,
      ) ??
      false;
    const visibilityLimitHexes =
      overrides?.visibilityLimitHexes ??
      this.dataSource.getVisibilityLimitHexes?.();

    const hardLineOfSightBlocked =
      overrides?.lineOfSightBlocked ??
      this.dataSource.isLineOfSightBlocked?.(
        request.attackerId,
        request.targetId,
      ) ??
      false;
    const visibilityBlocked =
      !hasThermalOptics &&
      visibilityLimitHexes !== undefined &&
      visibilityLimitHexes > 0 &&
      distanceHexes > visibilityLimitHexes;
    const terrainBlocked = terrainProfile?.blocking ?? false;
    const lineOfSightBlocked =
      hardLineOfSightBlocked || visibilityBlocked || terrainBlocked;
    const lineOfSightBlockReason =
      overrides?.lineOfSightBlockReason ??
      (visibilityBlocked
        ? `Target is beyond the ${visibilityLimitHexes}-hex visibility limit.`
        : terrainBlocked
          ? "Blocking terrain prevents line of sight."
          : this.dataSource.getLineOfSightBlockReason?.(
              request.attackerId,
              request.targetId,
            ));

    const helperCount = Math.max(
      0,
      Math.min(
        3,
        overrides?.helperCount ??
          this.dataSource.getHelperCount?.(request.attackerId) ??
          0,
      ),
    );

    const usesShotgunRangeRules =
      request.weaponId
        ? this.dataSource.usesShotgunRangeRules?.(request.weaponId) ?? false
        : false;

    return {
      attackerId: request.attackerId,
      targetId: request.targetId,
      weaponId: request.weaponId,
      distanceHexes,
      combatMode,
      rangeBand,
      sameHex,
      ...(combatGridEvidence ? { combatGridEvidence } : {}),
      attackerProne,
      aimMode,
      hasTelescopicSight,
      hasBipod,
      bipodDeployed,
      stablePlatform,
      calledShot,
      targetProne,
      targetDefenseless,
      targetSize,
      elevatedPosition,
      targetInFullCover,
      targetInPartialCover,
      coverEffectiveAgainstAttacker,
      ...(targetCoverArmorLevel !== undefined
        ? { targetCoverArmorLevel }
        : {}),
      approximateTargetLocationKnown,
      targetMoved,
      firingFromMovingVehicle,
      lightLevel,
      weatherModifier,
      denseSmoke,
      hasNightVision,
      hasThermalOptics,
      ...(visibilityLimitHexes !== undefined
        ? { visibilityLimitHexes }
        : {}),
      lineOfSightBlocked,
      ...(lineOfSightBlockReason
        ? { lineOfSightBlockReason }
        : {}),
      helperCount,
      ...(usesShotgunRangeRules
        ? { usesShotgunRangeRules: true }
        : {}),
      ...(targetTerrain
        ? {
            targetTerrain,
            targetTerrainCoverArmorLevel:
              terrainProfile?.coverArmorLevel ?? null,
            targetTerrainVisibilityHexes:
              terrainProfile?.visibilityHexes,
            targetTerrainBlocking:
              terrainProfile?.blocking ?? false,
          }
        : {}),
      ...(targetTerrainModifier !== undefined
        ? { targetTerrainModifier }
        : {}),
    };
  }
}
