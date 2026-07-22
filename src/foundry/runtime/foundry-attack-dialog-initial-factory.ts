import {
  getTerrainProfile,
} from "../../combat/terrain";
import type { AttackDialogInput } from "../../ui/attack-dialog-types";
import type { FoundryLiveAttackSelection } from "../combat/foundry-live-attack-types";
import {
  FoundrySelectionAttackContextSource,
  FoundryWeaponCategoryResolver,
} from "./foundry-runtime-adapters";
import {
  T2K4EAmmunitionAdapter,
} from "../t2k4e/t2k4e-ammunition-adapter";
import type {
  T2K4EActorLike,
  T2K4EItemLike,
} from "../t2k4e/t2k4e-types";
import {
  getMaximumAmmoDice,
} from "../../combat/ammo-resolver";

export class FoundryAttackDialogInitialFactory {
  constructor(
    private readonly getCanvas: () => unknown,
    private readonly categoryResolver: FoundryWeaponCategoryResolver,
    private readonly ammunitionAdapter =
      new T2K4EAmmunitionAdapter(),
  ) {}

  create(selection: FoundryLiveAttackSelection): AttackDialogInput {
    const weaponCategory = this.categoryResolver.resolve(selection.weapon);
    const hasTelescopicSight = this.categoryResolver.hasTelescopicSight(
      selection.weapon,
      selection.attackerActor,
    );
    const hasBipod = this.categoryResolver.hasBipod(
      selection.weapon,
      selection.attackerActor,
    );
    const hasTripod = this.categoryResolver.hasTripod(
      selection.weapon,
      selection.attackerActor,
    );
    const vehicleMounted = this.categoryResolver.isVehicleMounted(selection.weapon);

    const ammunition =
      this.ammunitionAdapter.getWeaponAmmoState(
        selection.attackerActor as T2K4EActorLike,
        selection.weapon as T2K4EItemLike,
      );

    const initial: AttackDialogInput = {
      weaponCategory,
      aimMode: "quick",
      calledShot: false,
      targetProne: false,
      targetDefenseless: false,
      targetInFullCover: false,
      targetInPartialCover: false,
      coverEffectiveAgainstAttacker: false,
      targetCoverArmorLevel: 0,
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
      visibilityLimitHexes: 0,
      lineOfSightBlocked: false,
      helperCount: 0,
      machineGunCarried: false,
      oneHanded: false,
      atShortRange: false,
      distanceHexes: 0,
      hasTelescopicSight,
      attackerProne: false,
      hasBipod,
      bipodDeployed: false,
      hasTripod,
      tripodDeployed: false,
      vehicleMounted,
      stablePlatform: false,
      ammoTracked:
        Boolean(ammunition),
      ammoDice: 0,
      maxAmmoDice:
        ammunition
          ? getMaximumAmmoDice(
              ammunition.rateOfFire,
              ammunition.roundsRemaining,
            )
          : 0,
      roundsRemaining:
        ammunition
          ?.roundsRemaining,
      ammoSuccessAllocation:
        "damage",
    };

    try {
      const source = new FoundrySelectionAttackContextSource(
        selection,
        this.getCanvas,
        this.categoryResolver,
      );

      const attackerId = this.readId(selection.attackerActor);
      const targetId = this.readId(selection.targetActor);

      if (!attackerId || !targetId) {
        return initial;
      }

      const distanceHexes = source.getTokenDistanceHexes(attackerId, targetId);
      initial.distanceHexes = distanceHexes;
      initial.atShortRange = source.isAtShortRange();
      initial.attackerProne = source.isAttackerProne(attackerId);
      initial.targetProne = source.isTargetProne(targetId);
      initial.targetDefenseless = source.isTargetDefenseless(targetId);
      initial.targetSize = source.getTargetSize(targetId);
      initial.elevatedPosition = source.isAttackerElevated(attackerId, targetId);
      initial.targetInFullCover = source.isTargetInFullCover(targetId);
      initial.targetInPartialCover = source.isTargetInPartialCover(targetId);
      initial.coverEffectiveAgainstAttacker =
        source.isCoverEffectiveAgainstAttacker(attackerId, targetId);
      initial.targetMoved = source.didTargetMove(targetId);
      initial.firingFromMovingVehicle =
        source.isFiringFromMovingVehicle(attackerId);
      initial.lightLevel = source.getLightLevel(attackerId, targetId);
      initial.weatherModifier = source.getWeatherModifier();
      initial.denseSmoke = source.hasDenseSmoke(attackerId, targetId);
      initial.hasNightVision = source.hasNightVision(attackerId, distanceHexes);
      initial.hasThermalOptics = source.hasThermalOptics(attackerId);
      initial.visibilityLimitHexes = source.getVisibilityLimitHexes() ?? 0;
      initial.lineOfSightBlocked = source.isLineOfSightBlocked(attackerId, targetId);
      initial.lineOfSightBlockReason = source.getLineOfSightBlockReason(attackerId, targetId);
      initial.helperCount = source.getHelperCount(attackerId);

      const targetTerrain = source.getTargetTerrain(targetId);
      if (targetTerrain) {
        const profile = getTerrainProfile(targetTerrain);
        initial.targetTerrainModifier = profile.rangedAttackModifier ?? 0;
        initial.targetCoverArmorLevel = profile.coverArmorLevel ?? 0;
        if (profile.blocking) {
          initial.lineOfSightBlocked = true;
          initial.lineOfSightBlockReason = "Blocking terrain prevents line of sight.";
        }
      }

      const explicitCoverArmor = source.getTargetCoverArmorLevel(targetId);
      if (explicitCoverArmor !== undefined) {
        initial.targetCoverArmorLevel = explicitCoverArmor;
      }

    } catch {
      // Preserve neutral/manual-safe defaults if Foundry context is incomplete.
    }

    return initial;
  }

  private readId(value: unknown): string | undefined {
    if (!value || typeof value !== "object") {
      return undefined;
    }

    const id = (value as Record<string, unknown>).id;
    return typeof id === "string" ? id : undefined;
  }
}
