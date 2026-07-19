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

    try {
      atShortRange = new FoundrySelectionAttackContextSource(
        selection,
        this.getCanvas,
        this.categoryResolver,
      ).isAtShortRange();
    } catch {
      atShortRange = false;
    }

    return {
      weaponCategory: this.categoryResolver.resolve(selection.weapon),
      aimMode: "fast",
      calledShot: false,
      targetProne: false,
      targetInFullCover: false,
      approximateTargetLocationKnown: false,
      targetMoved: false,
      firingFromMovingVehicle: false,
      targetSize: "normal",
      elevatedPosition: false,
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
}
