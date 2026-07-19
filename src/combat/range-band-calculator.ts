import type { RangeBand } from "./attack-context";
import type { WeaponRange } from "./weapon-range";

export class RangeBandCalculator {
  calculate(distanceHexes: number, weaponRange: WeaponRange): RangeBand {
    if (!Number.isFinite(distanceHexes) || distanceHexes < 0) {
      throw new Error("distanceHexes must be a non-negative finite number.");
    }

    if (!Number.isInteger(weaponRange.shortRangeHexes) || weaponRange.shortRangeHexes < 1) {
      throw new Error("shortRangeHexes must be a positive integer.");
    }

    const short = weaponRange.shortRangeHexes;

    if (distanceHexes <= short) return "short";
    if (distanceHexes <= short * 2) return "medium";
    if (distanceHexes <= short * 4) return "long";
    if (distanceHexes <= short * 8) return "extreme";
    return "out-of-range";
  }
}
