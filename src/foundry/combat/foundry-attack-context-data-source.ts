import type { AttackContextDataSource } from "../../combat/attack-context-builder";
import type { CombatMode, RangeBand } from "../../combat/attack-context";
import type { AttackRequest } from "../../combat/attack-request";

export interface FoundryAttackContextSource {
  getTokenDistanceHexes(attackerId: string, targetId: string): number;
  getWeaponRangeBand(weaponId: string, distanceHexes: number): RangeBand;
  isCloseCombatAttack(request: AttackRequest): boolean;
}

export class FoundryAttackContextDataSource implements AttackContextDataSource {
  constructor(private readonly source: FoundryAttackContextSource) {}

  getDistanceHexes(attackerId: string, targetId: string): number {
    return this.source.getTokenDistanceHexes(attackerId, targetId);
  }

  getCombatMode(request: AttackRequest, _distanceHexes: number): CombatMode {
    return this.source.isCloseCombatAttack(request) ? "close-combat" : "ranged";
  }

  getRangeBand(weaponId: string, distanceHexes: number): RangeBand {
    return this.source.getWeaponRangeBand(weaponId, distanceHexes);
  }
}
