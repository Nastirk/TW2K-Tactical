import type {
  AttackContext,
  CombatMode,
  RangeBand,
  TargetSizeCategory,
} from "./attack-context";
import type {
  AttackRequest,
} from "./attack-request";

export interface AttackContextDataSource {
  getDistanceHexes(
    attackerId: string,
    targetId: string,
  ): number;

  getCombatMode(
    request: AttackRequest,
    distanceHexes: number,
  ): CombatMode;

  getRangeBand(
    weaponId: string,
    distanceHexes: number,
  ): RangeBand;

  /**
   * Optional automatic context readers.
   *
   * They are optional so existing integrations continue
   * to work while automatic context detection is introduced
   * incrementally.
   */
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

    const combatMode =
      this.dataSource.getCombatMode(
        request,
        distanceHexes,
      );

    const sameHex =
      distanceHexes === 0;

    let rangeBand:
      RangeBand | undefined;

    if (
      combatMode === "ranged" &&
      request.weaponId
    ) {
      rangeBand =
        this.dataSource.getRangeBand(
          request.weaponId,
          distanceHexes,
        );
    }

    const targetProne =
      request.contextOverrides
        ?.targetProne ??
      this.dataSource.isTargetProne?.(
        request.targetId,
      ) ??
      false;

    const targetSize =
      request.contextOverrides
        ?.targetSize ??
      this.dataSource.getTargetSize?.(
        request.targetId,
      ) ??
      "normal";

    const elevatedPosition =
      request.contextOverrides
        ?.elevatedPosition ??
      this.dataSource.isAttackerElevated?.(
        request.attackerId,
        request.targetId,
      ) ??
      false;

    return {
      attackerId:
        request.attackerId,
      targetId:
        request.targetId,
      weaponId:
        request.weaponId,
      distanceHexes,
      combatMode,
      rangeBand,
      sameHex,
      targetProne,
      targetSize,
      elevatedPosition,
    };
  }
}