import {
  describe,
  expect,
  it,
} from "vitest";

import {
  normalizeStepDie,
} from "../../../src/foundry/t2k4e/t2k4e-step-die";

describe(
  "normalizeStepDie",
  () => {
    it.each([
      [6, 6],
      ["d8", 8],
      ["10", 10],
      ["A", 12],
      ["B", 10],
      ["C", 8],
      ["D", 6],
    ] as const)(
      "normalizes %s",
      (input, expected) => {
        expect(
          normalizeStepDie(
            input,
            "test",
          ),
        ).toBe(expected);
      },
    );
  },
);
