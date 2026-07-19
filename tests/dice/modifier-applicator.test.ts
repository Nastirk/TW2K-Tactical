import { describe, expect, it } from "vitest";
import { DiceModifierApplicator } from "../../src/dice/modifier-applicator";
import { DicePool } from "../../src/dice/pool";

describe("DiceModifierApplicator", () => {
  const applicator = new DiceModifierApplicator();

  it("returns the same pool for a zero modifier", () => {
    const result = applicator.apply(
      DicePool.from({ attribute: 10, skill: 8 }),
      0,
    );

    expect(result.dice).toEqual([10, 8]);
  });

  it("steps up the lower die first for a positive modifier", () => {
    const result = applicator.apply(
      DicePool.from({ attribute: 10, skill: 8 }),
      1,
    );

    expect(result.dice).toEqual([10, 10]);
  });

  it("steps down the higher die first for a negative modifier", () => {
    const result = applicator.apply(
      DicePool.from({ attribute: 10, skill: 8 }),
      -1,
    );

    expect(result.dice).toEqual([8, 8]);
  });

  it("applies multiple positive steps cumulatively", () => {
    const result = applicator.apply(
      DicePool.from({ attribute: 10, skill: 8 }),
      2,
    );

    expect(result.dice).toEqual([12, 10]);
  });

  it("applies multiple negative steps cumulatively", () => {
    const result = applicator.apply(
      DicePool.from({ attribute: 10, skill: 8 }),
      -2,
    );

    expect(result.dice).toEqual([8, 6]);
  });

  it("drops a D6 when it is stepped down", () => {
    const result = applicator.apply(
      DicePool.from({ attribute: 6, skill: 6 }),
      -1,
    );

    expect(result.dice).toEqual([6]);
  });

  it("can add a second D6 after a single D12", () => {
    const result = applicator.apply(
      DicePool.from({ attribute: 12 }),
      1,
    );

    expect(result.dice).toEqual([12, 6]);
  });

  it("caps the pool at two D12s", () => {
    const result = applicator.apply(
      DicePool.from({ attribute: 12, skill: 12 }),
      5,
    );

    expect(result.dice).toEqual([12, 12]);
  });

  it("rejects non-integer modifiers", () => {
    expect(() =>
      applicator.apply(
        DicePool.from({ attribute: 8, skill: 8 }),
        1.5,
      ),
    ).toThrow("modifier must be an integer.");
  });
});
