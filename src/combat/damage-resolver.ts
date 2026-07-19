export interface DamageResolutionRequest {
  weaponBaseDamage: number;

  /**
   * Successes beyond the first success that caused the hit.
   * Each increases damage by 1.
   */
  extraSuccesses?: number;
}

export interface DamageResolutionResult {
  weaponBaseDamage: number;
  extraSuccesses: number;
  damageBeforeArmor: number;
}

export class DamageResolver {
  resolve(
    request: DamageResolutionRequest,
  ): DamageResolutionResult {
    if (
      !Number.isInteger(
        request.weaponBaseDamage,
      ) ||
      request.weaponBaseDamage < 0
    ) {
      throw new Error(
        "weaponBaseDamage must be a non-negative integer.",
      );
    }

    const extraSuccesses =
      request.extraSuccesses ?? 0;

    if (
      !Number.isInteger(
        extraSuccesses,
      ) ||
      extraSuccesses < 0
    ) {
      throw new Error(
        "extraSuccesses must be a non-negative integer.",
      );
    }

    return {
      weaponBaseDamage:
        request.weaponBaseDamage,
      extraSuccesses,
      damageBeforeArmor:
        request.weaponBaseDamage +
        extraSuccesses,
    };
  }
}
