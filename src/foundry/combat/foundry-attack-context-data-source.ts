import type {
  AttackContextDataSource,
} from "../../combat/attack-context-builder";

import type {
  RangeBand,
} from "../../combat/attack-context";

export interface FoundryAttackContextSource {
  getTokenDistance(attackerId: string, targetId: string): number;
  getWeaponRangeBand(weaponId: string, distance: number): RangeBand;
}

export class FoundryAttackContextDataSource
  implements AttackContextDataSource
{
  constructor(
    private readonly source: FoundryAttackContextSource,
  ) {}

  getDistance(
    attackerId: string,
    targetId: string,
  ): number {
    return this.source.getTokenDistance(
      attackerId,
      targetId,
    );
  }

  getRangeBand(
    weaponId: string,
    distance: number,
  ): RangeBand {
    return this.source.getWeaponRangeBand(
      weaponId,
      distance,
    );
  }
}