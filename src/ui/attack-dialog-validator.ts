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

    const coverArmor = input.targetCoverArmorLevel ?? 0;
    if (!Number.isInteger(coverArmor) || coverArmor < 0) {
      throw new Error("targetCoverArmorLevel must be a non-negative integer.");
    }

    const visibility = input.visibilityLimitHexes ?? 0;
    if (!Number.isInteger(visibility) || visibility < 0) {
      throw new Error("visibilityLimitHexes must be a non-negative integer.");
    }

    const helpers = input.helperCount ?? 0;
    if (!Number.isInteger(helpers) || helpers < 0 || helpers > 3) {
      throw new Error("helperCount must be an integer from 0 to 3.");
    }

    if (input.targetInFullCover && input.targetInPartialCover) {
      throw new Error("Target cannot be in full cover and partial cover at the same time.");
    }

    if (input.aimMode === "slow" && !input.hasTelescopicSight) {
      throw new Error("Slow aim requires a telescopic sight.");
    }

    if (input.bipodDeployed && !input.hasBipod) {
      throw new Error(
        "Bipod deployment requires an equipped bipod attached to the selected weapon.",
      );
    }

    if (input.tripodDeployed && !input.hasTripod) {
      throw new Error(
        "Tripod deployment requires an equipped tripod attached to the selected weapon.",
      );
    }

    if (input.bipodDeployed && input.tripodDeployed) {
      throw new Error("A weapon cannot use a bipod and tripod at the same time.");
    }

    if (
      input.oneHanded &&
      (input.bipodDeployed || input.tripodDeployed)
    ) {
      throw new Error("A supported weapon cannot be fired one-handed.");
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
