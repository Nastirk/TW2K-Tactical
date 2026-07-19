import type { AttackContext, RangeBand } from "./attack-context";
import type { AttackRequest } from "./attack-request";

export interface AttackContextDataSource {
  getDistance(attackerId: string, targetId: string): number;
  getRangeBand(weaponId: string, distance: number): RangeBand;
}

export class AttackContextBuilder {
  constructor(private readonly dataSource: AttackContextDataSource) {}

  build(request: AttackRequest): AttackContext {
    const distance = this.dataSource.getDistance(
      request.attackerId,
      request.targetId,
    );

    const rangeBand = this.dataSource.getRangeBand(
      request.weaponId,
      distance,
    );

    return {
      attackerId: request.attackerId,
      targetId: request.targetId,
      weaponId: request.weaponId,
      distance,
      rangeBand,
    };
  }
}