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

export interface FoundryAttackContextSource {
  getTokenDistanceHexes(
    attackerId: string,
    targetId: string,
  ): number;

  getWeaponRangeBand(
    weaponId: string,
    distanceHexes: number,
  ): RangeBand;

  isCloseCombatAttack(
    request: AttackRequest,
  ): boolean;

  isAttackerProne?(
    attackerId: string,
  ): boolean;

  isTargetProne?(
    targetId: string,
  ): boolean;

  getTargetSize?(
    targetId: string,
  ): TargetSizeCategory;

  isAttackerElevated?(
    attackerId: string,
    targetId: string,
  ): boolean;

  getTargetTerrain?(
    targetId: string,
  ): TerrainType | undefined;

  hasTelescopicSight?(
    weaponId: string,
  ): boolean;

  hasBipod?(
    weaponId: string,
  ): boolean;

  usesShotgunRangeRules?(
    weaponId: string,
  ): boolean;
}

export class FoundryAttackContextDataSource
  implements AttackContextDataSource
{
  constructor(
    private readonly source:
      FoundryAttackContextSource,
  ) {}

  getDistanceHexes(
    attackerId: string,
    targetId: string,
  ): number {
    return this.source
      .getTokenDistanceHexes(
        attackerId,
        targetId,
      );
  }

  getCombatMode(
    request: AttackRequest,
    _distanceHexes: number,
  ): CombatMode {
    return this.source
      .isCloseCombatAttack(
        request,
      )
      ? "close-combat"
      : "ranged";
  }

  getRangeBand(
    weaponId: string,
    distanceHexes: number,
  ): RangeBand {
    return this.source
      .getWeaponRangeBand(
        weaponId,
        distanceHexes,
      );
  }

  isAttackerProne(
    attackerId: string,
  ): boolean {
    return this.source
      .isAttackerProne?.(
        attackerId,
      ) ?? false;
  }

  isTargetProne(
    targetId: string,
  ): boolean {
    return this.source
      .isTargetProne?.(
        targetId,
      ) ?? false;
  }

  getTargetSize(
    targetId: string,
  ): TargetSizeCategory {
    return this.source
      .getTargetSize?.(
        targetId,
      ) ?? "normal";
  }

  isAttackerElevated(
    attackerId: string,
    targetId: string,
  ): boolean {
    return this.source
      .isAttackerElevated?.(
        attackerId,
        targetId,
      ) ?? false;
  }

  getTargetTerrain(
    targetId: string,
  ): TerrainType | undefined {
    return this.source
      .getTargetTerrain?.(
        targetId,
      );
  }

  hasTelescopicSight(
    weaponId: string,
  ): boolean {
    return this.source
      .hasTelescopicSight?.(
        weaponId,
      ) ?? false;
  }

  hasBipod(
    weaponId: string,
  ): boolean {
    return this.source
      .hasBipod?.(
        weaponId,
      ) ?? false;
  }

  usesShotgunRangeRules(
    weaponId: string,
  ): boolean {
    return this.source
      .usesShotgunRangeRules?.(
        weaponId,
      ) ?? false;
  }
}
