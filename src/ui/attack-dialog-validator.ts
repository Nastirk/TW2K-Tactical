import type { AttackDialogInput } from "./attack-dialog-types";

export class AttackDialogValidator {
  validate(input: AttackDialogInput): void {
    if (
      !Number.isInteger(input.targetTerrainModifier) ||
      input.targetTerrainModifier > 0 ||
      input.targetTerrainModifier < -2
    ) {
      throw new Error("targetTerrainModifier must be 0, -1, or -2.");
    }

    if (
      !Number.isInteger(input.weatherModifier) ||
      input.weatherModifier > 0
    ) {
      throw new Error("weatherModifier must be an integer penalty of zero or less.");
    }

    if (input.aimMode === "slow" && !input.hasTelescopicSight) {
      throw new Error("Slow aim requires a telescopic sight.");
    }

    const ammoDice =
      input.ammoDice ?? 0;
    const maximum =
      input.maxAmmoDice ?? 0;

    if (
      !Number.isInteger(ammoDice) ||
      ammoDice < 0 ||
      ammoDice > maximum
    ) {
      throw new Error(
        `ammoDice must be an integer from 0 to ${maximum}.`,
      );
    }

    if (
      input.aimMode === "slow" &&
      ammoDice > 0
    ) {
      throw new Error(
        "Slow telescopic aim does not allow ammo dice.",
      );
    }
  }
}
