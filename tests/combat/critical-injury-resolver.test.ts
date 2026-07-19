import {
  describe,
  expect,
  it,
} from "vitest";

import {
  CriticalInjuryResolver,
} from "../../src/combat/critical-injury-resolver";

describe(
  "CriticalInjuryResolver",
  () => {
    const resolver =
      new CriticalInjuryResolver();

    it(
      "does not trigger below the crit threshold",
      () => {
        expect(
          resolver.resolve({
            damageAfterArmor: 2,
            critThreshold: 3,
          }),
        ).toEqual({
          triggered: false,
          d10Count: 0,
          damageOverThreshold: 0,
        });
      },
    );

    it(
      "triggers one D10 at the threshold",
      () => {
        expect(
          resolver.resolve({
            damageAfterArmor: 3,
            critThreshold: 3,
          }).d10Count,
        ).toBe(1);
      },
    );

    it(
      "uses two D10 at threshold plus two",
      () => {
        expect(
          resolver.resolve({
            damageAfterArmor: 5,
            critThreshold: 3,
          }).d10Count,
        ).toBe(2);
      },
    );

    it(
      "uses three D10 at threshold plus four",
      () => {
        expect(
          resolver.resolve({
            damageAfterArmor: 7,
            critThreshold: 3,
          }).d10Count,
        ).toBe(3);
      },
    );
  },
);
