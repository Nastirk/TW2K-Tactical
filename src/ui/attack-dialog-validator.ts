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

    if (
      input.bipodDeployed &&
      !input.hasBipod
    ) {
      throw new Error(
        "Bipod deployment requires an equipped bipod attached to the selected weapon.",
      );
    }

    if (
      input.tripodDeployed &&
      !input.hasTripod
    ) {
      throw new Error(
        "Tripod deployment requires an equipped tripod attached to the selected weapon.",
      );
    }
  }
}
