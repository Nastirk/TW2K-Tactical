import type { HitLocation } from "./hit-location-resolver";
import {
  CRITICAL_INJURY_TABLES,
  type CriticalInjuryEntry,
} from "./critical-injury-table";

export class CriticalInjuryTableResolver {
  resolve(
    location: HitLocation,
    roll: number,
  ): CriticalInjuryEntry {
    if (
      !Number.isInteger(roll) ||
      roll < 1 ||
      roll > 10
    ) {
      throw new Error(
        "Critical-injury roll must be an integer from 1 to 10.",
      );
    }

    const entry =
      CRITICAL_INJURY_TABLES[
        location
      ].find(
        (candidate) =>
          candidate.roll === roll,
      );

    if (!entry) {
      throw new Error(
        `No critical injury found for ${location} roll ${roll}.`,
      );
    }

    return entry;
  }
}
