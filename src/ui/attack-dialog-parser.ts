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
  ): AttackDialogInput {
    return {
      weaponCategory,
      aimMode: this.readEnum<AimMode>(form, "aimMode", ["quick", "fast", "slow"]),
      calledShot: this.readBoolean(form, "calledShot"),
      targetProne: this.readBoolean(form, "targetProne"),
      targetInFullCover: this.readBoolean(form, "targetInFullCover"),
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
      machineGunCarried: this.readBoolean(form, "machineGunCarried"),
      oneHanded: this.readBoolean(form, "oneHanded"),
      atShortRange: this.readBoolean(form, "atShortRange"),
      hasTelescopicSight: this.readBoolean(form, "hasTelescopicSight"),
      stablePlatform: this.readBoolean(form, "stablePlatform"),
      ammoDice: this.readInteger(form, "ammoDice", 0),
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
