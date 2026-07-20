import {
  getTerrainProfile,
} from "../../combat/terrain";
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
    let attackerProne = false;
    let targetProne = false;
    let targetSize:
      AttackDialogInput["targetSize"] =
        "normal";
    let elevatedPosition = false;
    let targetTerrainModifier = 0;

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

      if (attackerId) {
        attackerProne =
          source.isAttackerProne(
            attackerId,
          );
      }

      if (targetId) {
        targetProne =
          source.isTargetProne(
            targetId,
          );
        targetSize =
          source.getTargetSize(
            targetId,
          );

        const targetTerrain =
          source.getTargetTerrain(
            targetId,
          );

        if (targetTerrain) {
          targetTerrainModifier =
            getTerrainProfile(
              targetTerrain,
            ).rangedAttackModifier ??
            0;
        }
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
      attackerProne = false;
      targetProne = false;
      targetSize = "normal";
      elevatedPosition = false;
      targetTerrainModifier = 0;
    }

    return {
      weaponCategory: this.categoryResolver.resolve(selection.weapon),
      // Until action-economy integration can prove an Aim action
      // occurred, default to a quick shot rather than silently
      // granting the benefit of fast aim. The player may override it.
      aimMode: "quick",
      calledShot: false,
      targetProne,
      targetInFullCover: false,
      approximateTargetLocationKnown: false,
      targetMoved: false,
      firingFromMovingVehicle: false,
      targetSize,
      elevatedPosition,
      targetTerrainModifier,
      lightLevel: "normal",
      weatherModifier: 0,
      denseSmoke: false,
      hasNightVision: false,
      hasThermalOptics: false,
      machineGunCarried: false,
      oneHanded: false,
      atShortRange,
      attackerProne,
      hasTelescopicSight: this.categoryResolver.hasTelescopicSight(
        selection.weapon,
        selection.attackerActor,
      ),
      hasBipod: this.categoryResolver.hasBipod(
        selection.weapon,
        selection.attackerActor,
      ),
      bipodDeployed: false,
      hasTripod: this.categoryResolver.hasTripod(
        selection.weapon,
        selection.attackerActor,
      ),
      tripodDeployed: false,
      vehicleMounted: this.categoryResolver.isVehicleMounted(
        selection.weapon,
      ),
      // This checkbox represents only an additional/manual stable platform.
      // Automatic prone stability is carried separately via attackerProne.
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
