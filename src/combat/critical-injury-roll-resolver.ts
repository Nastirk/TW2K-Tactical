import type { HitLocation } from "./hit-location-resolver";
import type { CriticalInjuryEntry } from "./critical-injury-table";
import { CriticalInjuryTableResolver } from "./critical-injury-table-resolver";

export interface CriticalD10Roller {
  rollD10(): Promise<number>;
}

export interface CriticalInjuryRollRequest {
  location: HitLocation;
  d10Count: number;
}

export interface CriticalInjuryRollResult {
  rolls: number[];
  selectedRoll: number;
  injury: CriticalInjuryEntry;
}

export class CriticalInjuryRollResolver {
  constructor(
    private readonly roller:
      CriticalD10Roller,
    private readonly tableResolver:
      CriticalInjuryTableResolver,
  ) {}

  async resolve(
    request:
      CriticalInjuryRollRequest,
  ): Promise<CriticalInjuryRollResult> {
    if (
      !Number.isInteger(
        request.d10Count,
      ) ||
      request.d10Count < 1
    ) {
      throw new Error(
        "d10Count must be a positive integer.",
      );
    }

    const rolls: number[] = [];

    for (
      let index = 0;
      index < request.d10Count;
      index += 1
    ) {
      const roll =
        await this.roller.rollD10();

      if (
        !Number.isInteger(roll) ||
        roll < 1 ||
        roll > 10
      ) {
        throw new Error(
          "Critical-injury D10 roll must be an integer from 1 to 10.",
        );
      }

      rolls.push(roll);
    }

    const selectedRoll =
      Math.max(...rolls);

    return {
      rolls,
      selectedRoll,
      injury:
        this.tableResolver.resolve(
          request.location,
          selectedRoll,
        ),
    };
  }
}
