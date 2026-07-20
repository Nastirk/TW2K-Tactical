import {
  describe,
  expect,
  it,
} from "vitest";

import {
  getShotgunRangeDamageReduction,
} from "../../src/combat/shotgun-range";

describe(
  "getShotgunRangeDamageReduction",
  () => {
    it(
      "uses the official shotgun damage falloff by range",
      () => {
        expect(
          getShotgunRangeDamageReduction(
            "short",
          ),
        ).toBe(0);
        expect(
          getShotgunRangeDamageReduction(
            "medium",
          ),
        ).toBe(1);
        expect(
          getShotgunRangeDamageReduction(
            "long",
          ),
        ).toBe(2);
        expect(
          getShotgunRangeDamageReduction(
            "extreme",
          ),
        ).toBe(3);
      },
    );
  },
);
