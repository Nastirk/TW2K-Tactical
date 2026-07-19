export interface CriticalInjuryResolutionRequest {
  damageAfterArmor: number;
  critThreshold: number;
}

export interface CriticalInjuryResolutionResult {
  triggered: boolean;

  /**
   * Number of D10s to roll on the critical-injury table,
   * keeping the highest result.
   * Zero means no critical injury.
   */
  d10Count: number;

  damageOverThreshold: number;
}

export class CriticalInjuryResolver {
  resolve(
    request:
      CriticalInjuryResolutionRequest,
  ): CriticalInjuryResolutionResult {
    this.assertNonNegativeInteger(
      request.damageAfterArmor,
      "damageAfterArmor",
    );

    if (
      !Number.isInteger(
        request.critThreshold,
      ) ||
      request.critThreshold < 1
    ) {
      throw new Error(
        "critThreshold must be a positive integer.",
      );
    }

    if (
      request.damageAfterArmor <
      request.critThreshold
    ) {
      return {
        triggered: false,
        d10Count: 0,
        damageOverThreshold: 0,
      };
    }

    const damageOverThreshold =
      request.damageAfterArmor -
      request.critThreshold;

    return {
      triggered: true,
      d10Count:
        1 +
        Math.floor(
          damageOverThreshold / 2,
        ),
      damageOverThreshold,
    };
  }

  private assertNonNegativeInteger(
    value: number,
    name: string,
  ): void {
    if (
      !Number.isInteger(value) ||
      value < 0
    ) {
      throw new Error(
        `${name} must be a non-negative integer.`,
      );
    }
  }
}
