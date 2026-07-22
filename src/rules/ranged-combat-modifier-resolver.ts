import type {
  Modifier,
} from "./modifier";
import type {
  RangedCombatModifierInput,
  RangedCombatModifierResolution,
} from "./ranged-combat-modifier-types";

export class RangedCombatModifierResolver {
  resolve(
    input: RangedCombatModifierInput,
  ): RangedCombatModifierResolution {
    const blocked = this.getBlockedReason(input);

    if (blocked) {
      return {
        attackAllowed: false,
        blockedReason: blocked,
        modifiers: [],
        netModifier: 0,
        ammoDiceAllowed: input.aimMode !== "slow",
      };
    }

    const modifiers: Modifier[] = [];

    this.addAimModifiers(input, modifiers);

    // These fields remain supported for direct resolver consumers. The live
    // Foundry path neutralizes them and uses independent context providers.
    if (input.targetProne && !input.sameHex) {
      modifiers.push(this.inputModifier("target-prone", -1, "Target prone"));
    }

    if (
      input.targetInFullCover &&
      input.coverEffectiveAgainstAttacker !== false
    ) {
      modifiers.push(this.inputModifier("full-cover", -3, "Target in full cover"));
    }

    if (input.calledShot) {
      modifiers.push(this.inputModifier("called-shot", -2, "Called shot"));
    }

    if (input.targetMoved) {
      modifiers.push(this.inputModifier("moving-target", -1, "Moving target"));
    }

    if (input.firingFromMovingVehicle) {
      modifiers.push(this.inputModifier("moving-vehicle", -2, "Firing from moving vehicle"));
    }

    if (input.targetSize === "large") {
      modifiers.push(this.inputModifier("target-size", 2, "Large target"));
    } else if (input.targetSize === "small") {
      modifiers.push(this.inputModifier("target-size", -2, "Small target"));
    }

    if (input.elevatedPosition) {
      modifiers.push(this.inputModifier("elevation", 1, "Elevated firing position"));
    }

    const terrain = input.targetTerrainModifier ?? 0;
    if (terrain !== 0) {
      this.assertPenalty(terrain, "targetTerrainModifier");
      modifiers.push(this.inputModifier("target-terrain", terrain, "Target hex terrain"));
    }

    const helpers = input.helperCount ?? 0;
    if (helpers > 0) {
      modifiers.push(
        this.inputModifier(
          "helpers",
          Math.min(3, helpers),
          helpers === 1 ? "Help from 1 ally" : `Help from ${Math.min(3, helpers)} allies`,
        ),
      );
    }

    this.addVisibilityModifiers(input, modifiers);
    this.addWeaponHandlingModifiers(input, modifiers);

    return {
      attackAllowed: true,
      modifiers,
      netModifier: modifiers.reduce((sum, modifier) => sum + modifier.value, 0),
      ammoDiceAllowed: input.aimMode !== "slow",
    };
  }

  private addAimModifiers(
    input: RangedCombatModifierInput,
    modifiers: Modifier[],
  ): void {
    const aimMode = input.aimMode ?? "fast";

    if (aimMode === "quick") {
      const compact =
        input.weaponCategory === "pistol" ||
        input.weaponCategory === "carbine" ||
        input.weaponCategory === "smg";

      modifiers.push(
        this.inputModifier(
          "quick-shot",
          compact ? -1 : -2,
          "Quick shot (no aim)",
        ),
      );
      return;
    }

    if (aimMode === "slow") {
      if (!input.hasTelescopicSight) {
        throw new Error("Slow aim requires a telescopic sight.");
      }

      modifiers.push(
        this.inputModifier(
          "telescopic-sight",
          input.stablePlatform ? 2 : 1,
          input.stablePlatform
            ? "Telescopic sight with stable platform"
            : "Telescopic sight",
        ),
      );
    }
  }

  private addVisibilityModifiers(
    input: RangedCombatModifierInput,
    modifiers: Modifier[],
  ): void {
    if (input.hasThermalOptics) {
      return;
    }

    if (!input.hasNightVision) {
      if (input.lightLevel === "dim") {
        modifiers.push(this.inputModifier("light", -1, "Dim light"));
      }

      if (input.lightLevel === "dark") {
        modifiers.push(this.inputModifier("light", -2, "Darkness"));
      }
    }

    const weather = input.weatherModifier ?? 0;
    if (weather !== 0) {
      this.assertPenalty(weather, "weatherModifier");
      modifiers.push(this.inputModifier("weather", weather, "Adverse weather"));
    }

    if (input.denseSmoke) {
      modifiers.push(this.inputModifier("smoke", -3, "Dense smoke"));
    }
  }

  private addWeaponHandlingModifiers(
    input: RangedCombatModifierInput,
    modifiers: Modifier[],
  ): void {
    if (this.isMachineGunCarried(input)) {
      if (input.weaponCategory === "lmg") {
        modifiers.push(this.inputModifier("carried-machine-gun", -2, "LMG fired while carried"));
      }

      if (input.weaponCategory === "gpmg") {
        modifiers.push(this.inputModifier("carried-machine-gun", -3, "GPMG fired while carried"));
      }
    }

    if (!input.oneHanded) {
      return;
    }

    switch (input.weaponCategory) {
      case "pistol":
        return;
      case "smg":
      case "carbine":
        modifiers.push(this.inputModifier("one-handed", -2, "One-handed shooting"));
        return;
      case "rifle":
      case "assault-rifle":
      case "sniper-rifle":
      case "hunting-rifle":
        modifiers.push(this.inputModifier("one-handed", -3, "One-handed shooting"));
        return;
      default:
        return;
    }
  }

  private getBlockedReason(
    input: RangedCombatModifierInput,
  ): string | undefined {
    if (input.lineOfSightBlocked) {
      return input.lineOfSightBlockReason ?? "Line of sight is blocked.";
    }

    if (
      !input.hasThermalOptics &&
      (input.visibilityLimitHexes ?? 0) > 0 &&
      (input.distanceHexes ?? 0) > (input.visibilityLimitHexes ?? 0)
    ) {
      return `Target is beyond the ${input.visibilityLimitHexes}-hex visibility limit.`;
    }

    if (
      input.lightLevel === "total-darkness" &&
      !input.hasNightVision &&
      !input.hasThermalOptics
    ) {
      return "Target cannot be hit in total darkness.";
    }

    if (
      input.denseSmoke &&
      !input.approximateTargetLocationKnown &&
      !input.hasThermalOptics
    ) {
      return "Target location is unknown in dense smoke.";
    }

    if (
      input.targetInFullCover &&
      input.coverEffectiveAgainstAttacker !== false &&
      !input.approximateTargetLocationKnown
    ) {
      return "Target location is unknown behind full cover.";
    }

    if (
      input.weaponCategory === "hmg" &&
      !input.tripodDeployed &&
      !input.vehicleMounted
    ) {
      return "HMGs can only be fired from a tripod or vehicle mount.";
    }

    if (
      input.oneHanded &&
      this.isRifleCategory(input.weaponCategory) &&
      !input.atShortRange
    ) {
      return "Rifles and assault rifles can only be fired one-handed at SHORT range.";
    }

    if (
      input.oneHanded &&
      (input.weaponCategory === "lmg" ||
        input.weaponCategory === "gpmg" ||
        input.weaponCategory === "hmg")
    ) {
      return "Machine guns cannot be fired one-handed.";
    }

    return undefined;
  }

  private isRifleCategory(category: RangedCombatModifierInput["weaponCategory"]): boolean {
    return category === "rifle" ||
      category === "assault-rifle" ||
      category === "sniper-rifle" ||
      category === "hunting-rifle";
  }

  private isMachineGunCarried(input: RangedCombatModifierInput): boolean {
    const isMachineGun =
      input.weaponCategory === "lmg" ||
      input.weaponCategory === "gpmg" ||
      input.weaponCategory === "hmg";

    if (!isMachineGun) {
      return false;
    }

    return input.machineGunCarried === true ||
      (!input.bipodDeployed && !input.tripodDeployed && !input.vehicleMounted);
  }

  private inputModifier(
    source: string,
    value: number,
    description: string,
  ): Modifier {
    return {
      category: "ranged-combat",
      source,
      value,
      description,
      provenance: "input",
    };
  }

  private assertPenalty(value: number, label: string): void {
    if (!Number.isInteger(value) || value > 0) {
      throw new Error(`${label} must be an integer penalty of zero or less.`);
    }
  }
}
