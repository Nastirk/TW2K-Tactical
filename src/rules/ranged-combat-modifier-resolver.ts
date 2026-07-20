import type {
  Modifier,
} from "./modifier";
import type {
  RangedCombatModifierInput,
  RangedCombatModifierResolution,
} from "./ranged-combat-modifier-types";

export class RangedCombatModifierResolver {
  resolve(
    input:
      RangedCombatModifierInput,
  ): RangedCombatModifierResolution {
    const blocked =
      this.getBlockedReason(
        input,
      );

    if (blocked) {
      return {
        attackAllowed: false,
        blockedReason: blocked,
        modifiers: [],
        netModifier: 0,
        ammoDiceAllowed:
          input.aimMode !==
          "slow",
      };
    }

    const modifiers:
      Modifier[] = [];

    this.addAimModifiers(
      input,
      modifiers,
    );

    if (
      input.targetProne &&
      !input.sameHex
    ) {
      modifiers.push({
        category: "ranged-combat",
        source:
          "target-prone",
        value: -1,
        description:
          "Target prone",
      });
    }

    if (
      input.targetInFullCover
    ) {
      modifiers.push({
        category: "ranged-combat",
        source:
          "full-cover",
        value: -3,
        description:
          "Target in full cover",
      });
    }

    if (input.calledShot) {
      modifiers.push({
        category: "ranged-combat",
        source:
          "called-shot",
        value: -2,
        description:
          "Called shot",
      });
    }

    if (input.targetMoved) {
      modifiers.push({
        category: "ranged-combat",
        source:
          "moving-target",
        value: -1,
        description:
          "Moving target",
      });
    }

    if (
      input
        .firingFromMovingVehicle
    ) {
      modifiers.push({
        category: "ranged-combat",
        source:
          "moving-vehicle",
        value: -2,
        description:
          "Firing from moving vehicle",
      });
    }

    if (
      input.targetSize ===
      "large"
    ) {
      modifiers.push({
        category: "ranged-combat",
        source:
          "target-size",
        value: 2,
        description:
          "Large target",
      });
    } else if (
      input.targetSize ===
      "small"
    ) {
      modifiers.push({
        category: "ranged-combat",
        source:
          "target-size",
        value: -2,
        description:
          "Small target",
      });
    }

    if (
      input.elevatedPosition
    ) {
      modifiers.push({
        category: "ranged-combat",
        source:
          "elevation",
        value: 1,
        description:
          "Elevated firing position",
      });
    }

    const terrain =
      input
        .targetTerrainModifier ??
      0;

    if (terrain !== 0) {
      this.assertPenalty(
        terrain,
        "targetTerrainModifier",
      );

      modifiers.push({
        category: "ranged-combat",
        source:
          "target-terrain",
        value: terrain,
        description:
          "Target hex terrain",
      });
    }

    this.addVisibilityModifiers(
      input,
      modifiers,
    );

    this.addWeaponHandlingModifiers(
      input,
      modifiers,
    );

    return {
      attackAllowed: true,
      modifiers,
      netModifier:
        modifiers.reduce(
          (
            sum,
            modifier,
          ) =>
            sum +
            modifier.value,
          0,
        ),
      ammoDiceAllowed:
        input.aimMode !==
        "slow",
    };
  }

  private addAimModifiers(
    input:
      RangedCombatModifierInput,
    modifiers: Modifier[],
  ): void {
    const aimMode =
      input.aimMode ??
      "fast";

    if (
      aimMode === "quick"
    ) {
      const compact =
        input.weaponCategory ===
          "pistol" ||
        input.weaponCategory ===
          "carbine" ||
        input.weaponCategory ===
          "smg";

      modifiers.push({
        category: "ranged-combat",
        source:
          "quick-shot",
        value:
          compact
            ? -1
            : -2,
        description:
          "Quick shot (no aim)",
      });

      return;
    }

    if (
      aimMode === "slow"
    ) {
      if (
        !input
          .hasTelescopicSight
      ) {
        throw new Error(
          "Slow aim requires a telescopic sight.",
        );
      }

      modifiers.push({
        category: "ranged-combat",
        source:
          "telescopic-sight",
        value:
          input
            .stablePlatform
            ? 2
            : 1,
        description:
          input
            .stablePlatform
            ? "Telescopic sight with stable platform"
            : "Telescopic sight",
      });
    }
  }

  private addVisibilityModifiers(
    input:
      RangedCombatModifierInput,
    modifiers: Modifier[],
  ): void {
    if (
      input.hasThermalOptics
    ) {
      return;
    }

    if (
      !input.hasNightVision
    ) {
      if (
        input.lightLevel ===
        "dim"
      ) {
        modifiers.push({
        category: "ranged-combat",
          source: "light",
          value: -1,
          description:
            "Dim light",
        });
      }

      if (
        input.lightLevel ===
        "dark"
      ) {
        modifiers.push({
        category: "ranged-combat",
          source: "light",
          value: -2,
          description:
            "Darkness",
        });
      }
    }

    const weather =
      input.weatherModifier ??
      0;

    if (weather !== 0) {
      this.assertPenalty(
        weather,
        "weatherModifier",
      );

      modifiers.push({
        category: "ranged-combat",
        source: "weather",
        value: weather,
        description:
          "Adverse weather",
      });
    }

    if (input.denseSmoke) {
      modifiers.push({
        category: "ranged-combat",
        source: "smoke",
        value: -3,
        description:
          "Dense smoke",
      });
    }
  }

  private addWeaponHandlingModifiers(
    input:
      RangedCombatModifierInput,
    modifiers: Modifier[],
  ): void {
    if (
      this.isMachineGunCarried(
        input,
      )
    ) {
      if (
        input.weaponCategory ===
        "lmg"
      ) {
        modifiers.push({
          category: "ranged-combat",
          source:
            "carried-machine-gun",
          value: -2,
          description:
            "LMG fired while carried",
        });
      }

      if (
        input.weaponCategory ===
        "gpmg"
      ) {
        modifiers.push({
          category: "ranged-combat",
          source:
            "carried-machine-gun",
          value: -3,
          description:
            "GPMG fired while carried",
        });
      }
    }

    if (!input.oneHanded) {
      return;
    }

    switch (
      input.weaponCategory
    ) {
      case "pistol":
        return;

      case "smg":
      case "carbine":
        modifiers.push({
        category: "ranged-combat",
          source:
            "one-handed",
          value: -2,
          description:
            "One-handed shooting",
        });
        return;

      case "rifle":
      case "assault-rifle":
        modifiers.push({
        category: "ranged-combat",
          source:
            "one-handed",
          value: -3,
          description:
            "One-handed shooting",
        });
        return;

      default:
        return;
    }
  }

  private getBlockedReason(
    input:
      RangedCombatModifierInput,
  ): string | undefined {
    if (
      input.lightLevel ===
        "total-darkness" &&
      !input.hasNightVision &&
      !input.hasThermalOptics
    ) {
      return (
        "Target cannot be hit in total darkness."
      );
    }

    if (
      input.denseSmoke &&
      !input
        .approximateTargetLocationKnown &&
      !input.hasThermalOptics
    ) {
      return (
        "Target location is unknown in dense smoke."
      );
    }

    if (
      input.targetInFullCover &&
      !input
        .approximateTargetLocationKnown
    ) {
      return (
        "Target location is unknown behind full cover."
      );
    }

    if (
      input.weaponCategory ===
        "hmg" &&
      !input.tripodDeployed &&
      !input.vehicleMounted
    ) {
      return (
        "HMGs can only be fired from a tripod or vehicle mount."
      );
    }

    if (
      input.oneHanded &&
      (
        input.weaponCategory ===
          "rifle" ||
        input.weaponCategory ===
          "assault-rifle"
      ) &&
      !input.atShortRange
    ) {
      return (
        "Rifles and assault rifles can only be fired one-handed at SHORT range."
      );
    }

    if (
      input.oneHanded &&
      (
        input.weaponCategory ===
          "lmg" ||
        input.weaponCategory ===
          "gpmg" ||
        input.weaponCategory ===
          "hmg"
      )
    ) {
      return (
        "Machine guns cannot be fired one-handed."
      );
    }

    return undefined;
  }

  private isMachineGunCarried(
    input:
      RangedCombatModifierInput,
  ): boolean {
    const isMachineGun =
      input.weaponCategory ===
        "lmg" ||
      input.weaponCategory ===
        "gpmg" ||
      input.weaponCategory ===
        "hmg";

    if (!isMachineGun) {
      return false;
    }

    return (
      input.machineGunCarried ===
        true ||
      (
        !input.bipodDeployed &&
        !input.tripodDeployed &&
        !input.vehicleMounted
      )
    );
  }

  private assertPenalty(
    value: number,
    label: string,
  ): void {
    if (
      !Number.isInteger(value) ||
      value > 0
    ) {
      throw new Error(
        `${label} must be an integer penalty of zero or less.`,
      );
    }
  }
}
