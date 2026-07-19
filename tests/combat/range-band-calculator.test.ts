import { describe, expect, it } from "vitest";
import { RangeBandCalculator } from "../../src/combat/range-band-calculator";

describe("RangeBandCalculator", () => {
  const calculator = new RangeBandCalculator();
  const weaponRange = { shortRangeHexes: 3 };

  it("calculates all range bands", () => {
    expect(calculator.calculate(3, weaponRange)).toBe("short");
    expect(calculator.calculate(6, weaponRange)).toBe("medium");
    expect(calculator.calculate(12, weaponRange)).toBe("long");
    expect(calculator.calculate(24, weaponRange)).toBe("extreme");
    expect(calculator.calculate(25, weaponRange)).toBe("out-of-range");
  });
});
