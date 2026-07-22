import type {
  RangeBand,
} from "./attack-context";

export function getShotgunRangeDamageReduction(
  rangeBand:
    Exclude<RangeBand, "out-of-range">,
): number {
  switch (rangeBand) {
    case "short":
      return 0;
    case "medium":
      return 1;
    case "long":
      return 2;
    case "extreme":
      return 3;
  }
}
