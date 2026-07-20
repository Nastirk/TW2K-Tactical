import {
  describe,
  expect,
  it,
} from "vitest";

import {
  AttackContextBuilder,
  type AttackContextDataSource,
} from "../../src/combat/attack-context-builder";

describe(
  "AttackContextBuilder",
  () => {
    it(
      "builds a ranged attack context",
      () => {
        const dataSource:
          AttackContextDataSource = {
            getDistanceHexes:
              () => 4,
            getCombatMode:
              () => "ranged",
            getRangeBand:
              () => "medium",
          };

        const result =
          new AttackContextBuilder(
            dataSource,
          ).build({
            attackerId:
              "attacker-1",
            targetId:
              "target-1",
            weaponId:
              "weapon-1",
          });

        expect(
          result,
        ).toEqual({
          attackerId:
            "attacker-1",
          targetId:
            "target-1",
          weaponId:
            "weapon-1",
          distanceHexes: 4,
          combatMode:
            "ranged",
          rangeBand:
            "medium",
          sameHex: false,
          targetProne: false,
          targetSize:
            "normal",
          elevatedPosition:
            false,
        });
      },
    );

    it(
      "builds a same-hex ranged firearm context",
      () => {
        const dataSource:
          AttackContextDataSource = {
            getDistanceHexes:
              () => 0,
            getCombatMode:
              () => "ranged",
            getRangeBand:
              () => "short",
          };

        const result =
          new AttackContextBuilder(
            dataSource,
          ).build({
            attackerId:
              "attacker-1",
            targetId:
              "target-1",
            weaponId:
              "pistol-1",
          });

        expect(
          result.sameHex,
        ).toBe(true);

        expect(
          result.combatMode,
        ).toBe(
          "ranged",
        );

        expect(
          result.rangeBand,
        ).toBe(
          "short",
        );

        expect(
          result.targetProne,
        ).toBe(false);

        expect(
          result.targetSize,
        ).toBe(
          "normal",
        );

        expect(
          result.elevatedPosition,
        ).toBe(false);
      },
    );

    it(
      "builds a close-combat context without a range band",
      () => {
        const dataSource:
          AttackContextDataSource = {
            getDistanceHexes:
              () => 0,
            getCombatMode:
              () =>
                "close-combat",
            getRangeBand:
              () => "short",
          };

        const result =
          new AttackContextBuilder(
            dataSource,
          ).build({
            attackerId:
              "attacker-1",
            targetId:
              "target-1",
          });

        expect(
          result,
        ).toEqual({
          attackerId:
            "attacker-1",
          targetId:
            "target-1",
          weaponId:
            undefined,
          distanceHexes: 0,
          combatMode:
            "close-combat",
          rangeBand:
            undefined,
          sameHex: true,
          targetProne: false,
          targetSize:
            "normal",
          elevatedPosition:
            false,
        });
      },
    );

    it(
      "includes automatically observed combat context facts",
      () => {
        const dataSource:
          AttackContextDataSource = {
            getDistanceHexes:
              () => 3,
            getCombatMode:
              () => "ranged",
            getRangeBand:
              () => "short",
            isTargetProne:
              () => true,
            getTargetSize:
              () => "large",
            isAttackerElevated:
              () => true,
          };

        const result =
          new AttackContextBuilder(
            dataSource,
          ).build({
            attackerId:
              "attacker-1",
            targetId:
              "target-1",
            weaponId:
              "weapon-1",
          });

        expect(
          result.targetProne,
        ).toBe(true);

        expect(
          result.targetSize,
        ).toBe(
          "large",
        );

        expect(
          result.elevatedPosition,
        ).toBe(true);
      },
    );

    it(
      "adds automatic shotgun range behavior to the attack context",
      () => {
        const dataSource:
          AttackContextDataSource = {
            getDistanceHexes:
              () => 3,
            getCombatMode:
              () => "ranged",
            getRangeBand:
              () => "medium",
            usesShotgunRangeRules:
              () => true,
          };

        const result =
          new AttackContextBuilder(
            dataSource,
          ).build({
            attackerId:
              "attacker-1",
            targetId:
              "target-1",
            weaponId:
              "shotgun-1",
          });

        expect(
          result
            .usesShotgunRangeRules,
        ).toBe(true);
      },
    );

    it(
      "uses neutral defaults when automatic context readers are unavailable",
      () => {
        const dataSource:
          AttackContextDataSource = {
            getDistanceHexes:
              () => 2,
            getCombatMode:
              () => "ranged",
            getRangeBand:
              () => "short",
          };

        const result =
          new AttackContextBuilder(
            dataSource,
          ).build({
            attackerId:
              "attacker-1",
            targetId:
              "target-1",
            weaponId:
              "weapon-1",
          });

        expect(
          result.targetProne,
        ).toBe(false);

        expect(
          result.targetSize,
        ).toBe(
          "normal",
        );

        expect(
          result.elevatedPosition,
        ).toBe(false);
      },
    );

    it(
      "prefers explicit context overrides over automatically observed facts",
      () => {
        const dataSource:
          AttackContextDataSource = {
            getDistanceHexes:
              () => 3,
            getCombatMode:
              () => "ranged",
            getRangeBand:
              () => "short",
            isTargetProne:
              () => true,
            getTargetSize:
              () => "large",
            isAttackerElevated:
              () => true,
          };

        const result =
          new AttackContextBuilder(
            dataSource,
          ).build({
            attackerId:
              "attacker-1",
            targetId:
              "target-1",
            weaponId:
              "weapon-1",
            contextOverrides: {
              targetProne: false,
              targetSize: "small",
              elevatedPosition: false,
            },
          });

        expect(
          result.targetProne,
        ).toBe(false);

        expect(
          result.targetSize,
        ).toBe(
          "small",
        );

        expect(
          result.elevatedPosition,
        ).toBe(false);
      },
    );

    it(
      "adds structured target terrain facts to the attack context",
      () => {
        const dataSource:
          AttackContextDataSource = {
            getDistanceHexes:
              () => 3,
            getCombatMode:
              () => "ranged",
            getRangeBand:
              () => "short",
            getTargetTerrain:
              () => "forest",
          };

        const result =
          new AttackContextBuilder(
            dataSource,
          ).build({
            attackerId:
              "attacker-1",
            targetId:
              "target-1",
            weaponId:
              "weapon-1",
          });

        expect(
          result.targetTerrain,
        ).toBe("forest");
        expect(
          result.targetTerrainModifier,
        ).toBe(-1);
        expect(
          result.targetTerrainCoverArmorLevel,
        ).toBe(2);
        expect(
          result.targetTerrainVisibilityHexes,
        ).toBe(3);
        expect(
          result.targetTerrainBlocking,
        ).toBe(false);
      },
    );

    it(
      "allows an explicit terrain modifier override while preserving detected terrain facts",
      () => {
        const dataSource:
          AttackContextDataSource = {
            getDistanceHexes:
              () => 3,
            getCombatMode:
              () => "ranged",
            getRangeBand:
              () => "short",
            getTargetTerrain:
              () => "foliage",
          };

        const result =
          new AttackContextBuilder(
            dataSource,
          ).build({
            attackerId:
              "attacker-1",
            targetId:
              "target-1",
            weaponId:
              "weapon-1",
            contextOverrides: {
              targetTerrainModifier:
                -1,
            },
          });

        expect(
          result.targetTerrain,
        ).toBe("foliage");
        expect(
          result.targetTerrainModifier,
        ).toBe(-1);
        expect(
          result.targetTerrainVisibilityHexes,
        ).toBe(1);
      },
    );

  },
);