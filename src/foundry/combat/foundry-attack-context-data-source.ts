import type {
  AttackContextDataSource,
} from "../../combat/attack-context-builder";
import type {
  CombatMode,
  RangeBand,
  TargetSizeCategory,
} from "../../combat/attack-context";
import type {
  TerrainType,
} from "../../combat/terrain";
import type {
  AttackRequest,
} from "../../combat/attack-request";
import type {
  LightLevel,
} from "../../rules/ranged-combat-modifier-types";
import type {
  T2KCombatGridEvidence,
} from "../../combat/t2k-combat-grid";

export interface FoundryAttackContextSource {
  getTokenDistanceHexes(attackerId: string, targetId: string): number;
  getCombatGridEvidence?(
    attackerId: string,
    targetId: string,
  ): T2KCombatGridEvidence | undefined;
  getWeaponRangeBand(weaponId: string, distanceHexes: number): RangeBand;
  isCloseCombatAttack(request: AttackRequest): boolean;

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

export class FoundryAttackContextDataSource
  implements AttackContextDataSource
{
  constructor(
    private readonly source: FoundryAttackContextSource,
  ) {}

  getDistanceHexes(attackerId: string, targetId: string): number {
    return this.source.getTokenDistanceHexes(attackerId, targetId);
  }

  getCombatGridEvidence(
    attackerId: string,
    targetId: string,
  ): T2KCombatGridEvidence | undefined {
    return this.source.getCombatGridEvidence?.(attackerId, targetId);
  }

  getCombatMode(request: AttackRequest, _distanceHexes: number): CombatMode {
    return this.source.isCloseCombatAttack(request)
      ? "close-combat"
      : "ranged";
  }

  getRangeBand(weaponId: string, distanceHexes: number): RangeBand {
    return this.source.getWeaponRangeBand(weaponId, distanceHexes);
  }

  isAttackerProne(attackerId: string): boolean {
    return this.source.isAttackerProne?.(attackerId) ?? false;
  }

  isTargetProne(targetId: string): boolean {
    return this.source.isTargetProne?.(targetId) ?? false;
  }

  isTargetDefenseless(targetId: string): boolean {
    return this.source.isTargetDefenseless?.(targetId) ?? false;
  }

  getTargetSize(targetId: string): TargetSizeCategory {
    return this.source.getTargetSize?.(targetId) ?? "normal";
  }

  isAttackerElevated(attackerId: string, targetId: string): boolean {
    return this.source.isAttackerElevated?.(attackerId, targetId) ?? false;
  }

  getTargetTerrain(targetId: string): TerrainType | undefined {
    return this.source.getTargetTerrain?.(targetId);
  }

  isTargetInFullCover(targetId: string): boolean {
    return this.source.isTargetInFullCover?.(targetId) ?? false;
  }

  isTargetInPartialCover(targetId: string): boolean {
    return this.source.isTargetInPartialCover?.(targetId) ?? false;
  }

  isCoverEffectiveAgainstAttacker(attackerId: string, targetId: string): boolean {
    return this.source.isCoverEffectiveAgainstAttacker?.(attackerId, targetId) ?? false;
  }

  getTargetCoverArmorLevel(targetId: string): number | undefined {
    return this.source.getTargetCoverArmorLevel?.(targetId);
  }

  didTargetMove(targetId: string): boolean {
    return this.source.didTargetMove?.(targetId) ?? false;
  }

  isFiringFromMovingVehicle(attackerId: string): boolean {
    return this.source.isFiringFromMovingVehicle?.(attackerId) ?? false;
  }

  getLightLevel(attackerId: string, targetId: string): LightLevel {
    return this.source.getLightLevel?.(attackerId, targetId) ?? "normal";
  }

  getWeatherModifier(): number {
    return this.source.getWeatherModifier?.() ?? 0;
  }

  hasDenseSmoke(attackerId: string, targetId: string): boolean {
    return this.source.hasDenseSmoke?.(attackerId, targetId) ?? false;
  }

  hasNightVision(attackerId: string, distanceHexes: number): boolean {
    return this.source.hasNightVision?.(attackerId, distanceHexes) ?? false;
  }

  hasThermalOptics(attackerId: string): boolean {
    return this.source.hasThermalOptics?.(attackerId) ?? false;
  }

  getVisibilityLimitHexes(): number | undefined {
    return this.source.getVisibilityLimitHexes?.();
  }

  isLineOfSightBlocked(attackerId: string, targetId: string): boolean {
    return this.source.isLineOfSightBlocked?.(attackerId, targetId) ?? false;
  }

  getLineOfSightBlockReason(attackerId: string, targetId: string): string | undefined {
    return this.source.getLineOfSightBlockReason?.(attackerId, targetId);
  }

  getHelperCount(attackerId: string): number {
    return this.source.getHelperCount?.(attackerId) ?? 0;
  }

  hasTelescopicSight(weaponId: string): boolean {
    return this.source.hasTelescopicSight?.(weaponId) ?? false;
  }

  hasBipod(weaponId: string): boolean {
    return this.source.hasBipod?.(weaponId) ?? false;
  }

  usesShotgunRangeRules(weaponId: string): boolean {
    return this.source.usesShotgunRangeRules?.(weaponId) ?? false;
  }
}
