import {
  describe,
  expect,
  it,
} from "vitest";

import {
  FoundryAttackContextDataSource,
  type FoundryAttackContextSource,
} from "../../../src/foundry/combat/foundry-attack-context-data-source";

describe(
  "FoundryAttackContextDataSource",
  () => {
    it(
      "returns distance and range band from the Foundry source",
      () => {
        const source: FoundryAttackContextSource = {
          getTokenDistance: () => 30,
          getWeaponRangeBand: () => "short",
        };

        const dataSource =
          new FoundryAttackContextDataSource(
            source,
          );

        expect(
          dataSource.getDistance(
            "attacker-1",
            "target-1",
          ),
        ).toBe(30);

        expect(
          dataSource.getRangeBand(
            "weapon-1",
            30,
          ),
        ).toBe("short");
      },
    );
  },
);