import type { AttackDialogInput } from "../../ui/attack-dialog-types";
import type { FoundryLiveAttackSelection } from "../combat/foundry-live-attack-types";
import {
  FoundrySelectionAttackContextSource,
  FoundryWeaponCategoryResolver,
} from "./foundry-runtime-adapters";

export class FoundryAttackDialogInitialFactory {
  constructor(
    private readonly getCanvas: () => unknown,
    private readonly categoryResolver: FoundryWeaponCategoryResolver,
  ) {}

  create(selection: FoundryLiveAttackSelection): AttackDialogInput {
    let atShortRange = false;
    let targetProne = false;
    let targetSize:
      AttackDialogInput["targetSize"] =
        "normal";
    let elevatedPosition = false;

    try {
      const source =
        new FoundrySelectionAttackContextSource(
          selection,
          this.getCanvas,
          this.categoryResolver,
        );

      const attackerId =
        this.readId(
          selection.attackerActor,
        );
      const targetId =
        this.readId(
          selection.targetActor,
        );

      atShortRange =
        source.isAtShortRange();

      if (targetId) {
        targetProne =
          source.isTargetProne(
            targetId,
          );
        targetSize =
          source.getTargetSize(
            targetId,
          );
      }

      if (
        attackerId &&
        targetId
      ) {
        elevatedPosition =
          source.isAttackerElevated(
            attackerId,
            targetId,
          );
      }
    } catch {
      atShortRange = false;
      targetProne = false;
      targetSize = "normal";
      elevatedPosition = false;
    }

    return {
      weaponCategory: this.categoryResolver.resolve(selection.weapon),
      aimMode: "fast",
      calledShot: false,
      targetProne,
      targetInFullCover: false,
      approximateTargetLocationKnown: false,
      targetMoved: false,
      firingFromMovingVehicle: false,
      targetSize,
      elevatedPosition,
      targetTerrainModifier: 0,
      lightLevel: "normal",
      weatherModifier: 0,
      denseSmoke: false,
      hasNightVision: false,
      hasThermalOptics: false,
      machineGunCarried: false,
      oneHanded: false,
      atShortRange,
      hasTelescopicSight: this.categoryResolver.hasTelescopicSight(selection.weapon),
      stablePlatform: false,
    };
  }

  private readId(
    value: unknown,
  ): string | undefined {
    if (
      !value ||
      typeof value !== "object"
    ) {
      return undefined;
    }

    const id =
      (value as Record<
        string,
        unknown
      >).id;

    return typeof id === "string"
      ? id
      : undefined;
  }
}
