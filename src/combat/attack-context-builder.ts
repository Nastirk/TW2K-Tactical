import type { AttackContext, CombatMode, RangeBand } from "./attack-context";
import type { AttackRequest } from "./attack-request";

export interface AttackContextDataSource {
  getDistanceHexes(attackerId: string, targetId: string): number;
  getCombatMode(request: AttackRequest, distanceHexes: number): CombatMode;
  getRangeBand(weaponId: string, distanceHexes: number): RangeBand;
}

export class AttackContextBuilder {
  constructor(private readonly dataSource: AttackContextDataSource) {}

  build(request: AttackRequest): AttackContext {
    const distanceHexes = this.dataSource.getDistanceHexes(
      request.attackerId,
      request.targetId,
    );

    const combatMode = this.dataSource.getCombatMode(request, distanceHexes);
    const sameHex = distanceHexes === 0;

    let rangeBand: RangeBand | undefined;

    if (combatMode === "ranged" && request.weaponId) {
      rangeBand = this.dataSource.getRangeBand(request.weaponId, distanceHexes);
    }

    return {
      attackerId: request.attackerId,
      targetId: request.targetId,
      weaponId: request.weaponId,
      distanceHexes,
      combatMode,
      rangeBand,
      sameHex,
    };
  }
}
