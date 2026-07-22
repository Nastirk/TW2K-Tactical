import type {
  DieRoller,
} from "../dice/roller";

export type AmmoSuccessAllocation =
  | "damage"
  | "additional-hits";

export interface AmmoAttackRequest {
  ammunitionItemId: string;
  rateOfFire: number;
  roundsBefore: number;
  ammoDice: number;
  allocation: AmmoSuccessAllocation;
  slowAim: boolean;
}

export interface AmmoAttackResult {
  ammunitionItemId: string;
  rateOfFire: number;
  roundsBefore: number;
  ammoDice: number;
  rolls: number[];
  successes: number;
  allocation: AmmoSuccessAllocation;
  damageSuccesses: number;
  additionalHitSuccesses: number;
  roundsSpent: number;
  roundsRemaining: number;
  empty: boolean;
}

export function getMaximumAmmoDice(
  rateOfFire: number,
  roundsRemaining: number,
): number {
  if (
    !Number.isInteger(rateOfFire) ||
    !Number.isInteger(roundsRemaining)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      rateOfFire,
      roundsRemaining - 1,
    ),
  );
}

export class AmmoAttackResolver {
  constructor(
    private readonly roller:
      DieRoller,
  ) {}

  validate(
    request:
      AmmoAttackRequest,
  ): void {
    this.assertNonNegativeInteger(
      request.rateOfFire,
      "rateOfFire",
    );
    this.assertNonNegativeInteger(
      request.roundsBefore,
      "roundsBefore",
    );
    this.assertNonNegativeInteger(
      request.ammoDice,
      "ammoDice",
    );

    if (
      request.roundsBefore === 0
    ) {
      throw new Error(
        "The weapon is empty.",
      );
    }

    if (
      request.slowAim &&
      request.ammoDice > 0
    ) {
      throw new Error(
        "Slow telescopic aim does not allow ammo dice.",
      );
    }

    const maximum =
      getMaximumAmmoDice(
        request.rateOfFire,
        request.roundsBefore,
      );

    if (
      request.ammoDice > maximum
    ) {
      throw new Error(
        `ammoDice cannot exceed ${maximum} for this weapon and its remaining ammunition.`,
      );
    }

    if (
      request.allocation !==
        "damage" &&
      request.allocation !==
        "additional-hits"
    ) {
      throw new Error(
        "Invalid ammo-success allocation.",
      );
    }
  }

  async resolve(
    request:
      AmmoAttackRequest,
  ): Promise<AmmoAttackResult> {
    this.validate(request);

    const rolls: number[] = [];

    for (
      let index = 0;
      index < request.ammoDice;
      index += 1
    ) {
      const value =
        await this.roller
          .rollDie(6);

      if (
        !Number.isInteger(value) ||
        value < 1 ||
        value > 6
      ) {
        throw new Error(
          `Invalid ammo die result ${value}. Expected an integer between 1 and 6.`,
        );
      }

      rolls.push(value);
    }

    const successes =
      rolls.filter(
        (value) => value === 6,
      ).length;

    const rolledExpenditure =
      rolls.reduce(
        (sum, value) =>
          sum + value,
        0,
      );

    const roundsSpent =
      Math.min(
        request.roundsBefore,
        1 + rolledExpenditure,
      );

    const roundsRemaining =
      request.roundsBefore -
      roundsSpent;

    return {
      ammunitionItemId:
        request.ammunitionItemId,
      rateOfFire:
        request.rateOfFire,
      roundsBefore:
        request.roundsBefore,
      ammoDice:
        request.ammoDice,
      rolls,
      successes,
      allocation:
        request.allocation,
      damageSuccesses:
        request.allocation ===
          "damage"
          ? successes
          : 0,
      additionalHitSuccesses:
        request.allocation ===
          "additional-hits"
          ? successes
          : 0,
      roundsSpent,
      roundsRemaining,
      empty:
        roundsRemaining === 0,
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
