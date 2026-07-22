import type { AttackDialogInput } from "./attack-dialog-types";
import type { AimMode, LightLevel, TargetSize } from "../rules/ranged-combat-modifier-types";
import type { AmmoSuccessAllocation } from "../combat/ammo-resolver";

export type AttackDialogFormValue = string | boolean | number | undefined;

export interface AttackDialogFormDataLike {
  get(name: string): AttackDialogFormValue;
}

export class AttackDialogParser {
  parse(
    form: AttackDialogFormDataLike,
    weaponCategory: AttackDialogInput["weaponCategory"],
    trustedInitial?: Pick<
      AttackDialogInput,
      "ammoTracked" | "maxAmmoDice" | "roundsRemaining"
    >,
  ): AttackDialogInput {
    return {
      weaponCategory,
      aimMode: this.readEnum<AimMode>(form, "aimMode", ["quick", "fast", "slow"]),
      calledShot: this.readBoolean(form, "calledShot"),
      targetProne: this.readBoolean(form, "targetProne"),
      targetDefenseless: this.readBoolean(form, "targetDefenseless"),
      targetInFullCover: this.readBoolean(form, "targetInFullCover"),
      targetInPartialCover: this.readBoolean(form, "targetInPartialCover"),
      coverEffectiveAgainstAttacker: this.readBoolean(form, "coverEffectiveAgainstAttacker"),
      targetCoverArmorLevel: this.readIntegerDefault(form, "targetCoverArmorLevel", 0),
      approximateTargetLocationKnown: this.readBoolean(form, "approximateTargetLocationKnown"),
      targetMoved: this.readBoolean(form, "targetMoved"),
      firingFromMovingVehicle: this.readBoolean(form, "firingFromMovingVehicle"),
      targetSize: this.readEnum<TargetSize>(form, "targetSize", ["normal", "large", "small"]),
      elevatedPosition: this.readBoolean(form, "elevatedPosition"),
      targetTerrainModifier: this.readInteger(form, "targetTerrainModifier"),
      lightLevel: this.readEnum<LightLevel>(form, "lightLevel", ["normal", "dim", "dark", "total-darkness"]),
      weatherModifier: this.readInteger(form, "weatherModifier"),
      denseSmoke: this.readBoolean(form, "denseSmoke"),
      hasNightVision: this.readBoolean(form, "hasNightVision"),
      hasThermalOptics: this.readBoolean(form, "hasThermalOptics"),
      visibilityLimitHexes: this.readIntegerDefault(form, "visibilityLimitHexes", 0),
      lineOfSightBlocked: this.readBoolean(form, "lineOfSightBlocked"),
      lineOfSightBlockReason: this.readString(form, "lineOfSightBlockReason"),
      helperCount: this.readIntegerDefault(form, "helperCount", 0),
      machineGunCarried: this.readBoolean(form, "machineGunCarried"),
      oneHanded: this.readBoolean(form, "oneHanded"),
      atShortRange: this.readBoolean(form, "atShortRange"),
      distanceHexes: this.readIntegerDefault(form, "distanceHexes", 0),
      hasTelescopicSight: this.readBoolean(form, "hasTelescopicSight"),
      attackerProne: this.readBoolean(form, "attackerProne"),
      hasBipod: this.readBoolean(form, "hasBipod"),
      bipodDeployed: this.readBoolean(form, "bipodDeployed"),
      hasTripod: this.readBoolean(form, "hasTripod"),
      tripodDeployed: this.readBoolean(form, "tripodDeployed"),
      vehicleMounted: this.readBoolean(form, "vehicleMounted"),
      stablePlatform: this.readBoolean(form, "stablePlatform"),
      ammoTracked: trustedInitial?.ammoTracked ?? false,
      ammoDice: this.readInteger(form, "ammoDice", 0),
      maxAmmoDice: trustedInitial?.maxAmmoDice ?? 0,
      roundsRemaining: trustedInitial?.roundsRemaining,
      ammoSuccessAllocation:
        this.readEnum<AmmoSuccessAllocation>(
          form,
          "ammoSuccessAllocation",
          [
            "damage",
            "additional-hits",
          ],
          "damage",
        ),
    };
  }

  private readBoolean(form: AttackDialogFormDataLike, name: string): boolean {
    const value = form.get(name);
    return value === true || value === "true" || value === "on";
  }

  private readInteger(
    form: AttackDialogFormDataLike,
    name: string,
    fallback?: number,
  ): number {
    const value = form.get(name);

    if (
      value === undefined &&
      fallback !== undefined
    ) {
      return fallback;
    }

    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isInteger(parsed)) {
      throw new Error(`${name} must be an integer.`);
    }
    return parsed;
  }

  private readIntegerDefault(
    form: AttackDialogFormDataLike,
    name: string,
    fallback: number,
  ): number {
    const value = form.get(name);
    if (value === undefined || value === "") {
      return fallback;
    }
    return this.readInteger(form, name);
  }

  private readString(form: AttackDialogFormDataLike, name: string): string | undefined {
    const value = form.get(name);
    return typeof value === "string" && value.length > 0
      ? value
      : undefined;
  }

  private readEnum<T extends string>(
    form: AttackDialogFormDataLike,
    name: string,
    allowed: readonly T[],
    fallback?: T,
  ): T {
    const value = form.get(name);

    if (
      value === undefined &&
      fallback !== undefined
    ) {
      return fallback;
    }

    if (typeof value !== "string" || !allowed.includes(value as T)) {
      throw new Error(`Invalid ${name}.`);
    }
    return value as T;
  }
}
