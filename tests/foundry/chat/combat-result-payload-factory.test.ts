import {
  describe,
  expect,
  it,
} from "vitest";

import {
  CombatResultPayloadFactory,
} from "../../../src/foundry/chat/combat-result-payload-factory";

describe(
  "CombatResultPayloadFactory",
  () => {
    it(
      "creates a staged actor-update payload",
      () => {
        const payload =
          new CombatResultPayloadFactory()
            .create({
              attack: {
                context: {
                  attackerId:
                    "a",
                  targetId: "t",
                  weaponId: "w",
                  distanceHexes: 1,
                  combatMode:
                    "ranged",
                  rangeBand:
                    "short",
                  sameHex: false,
                },
                basePool: {
                  dice: [8, 8],
                } as never,
                modifiers: [],
                netModifier: 0,
                finalPool: {
                  dice: [8, 8],
                } as never,
                roll: {
                  rolls: [],
                  successes: 1,
                },
              },
              hit: true,
              postHit: {
                location:
                  "torso",
                damage: {
                  weaponBaseDamage: 2,
                  extraSuccesses: 0,
                  damageBeforeArmor: 2,
                },
                armor: {
                  incomingDamage: 2,
                  bodyArmorLevel: 0,
                  externalArmorLevel: 0,
                  combinedArmorLevel: 0,
                  weaponArmorModifier: 0,
                  modifiedArmorLevel: 0,
                  fullyDeflectedByPenetrationLimit:
                    false,
                  penetrated:
                    false,
                  damageAfterArmor: 2,
                  ablationCheckRequired:
                    false,
                },
                criticalInjury: {
                  triggered:
                    false,
                  d10Count: 0,
                  damageOverThreshold: 0,
                },
                finalDamage: 2,
              },
              targetActorId:
                "target",
              targetUpdated:
                false,
            });

        expect(
          payload,
        ).toEqual({
          targetActorId:
            "target",
          finalDamage: 2,
          criticalInjury:
            undefined,
          deathSaveState:
            undefined,
        });
      },
    );


    it(
      "includes the targeted synthetic actor UUID when provided",
      () => {
        const payload =
          new CombatResultPayloadFactory()
            .create(
              {
                attack: {
                  context: {
                    attackerId: "a",
                    targetId: "t",
                    weaponId: "w",
                    distanceHexes: 1,
                    combatMode: "ranged",
                    rangeBand: "short",
                    sameHex: false,
                  },
                  basePool: {
                    dice: [8, 8],
                  } as never,
                  modifiers: [],
                  netModifier: 0,
                  finalPool: {
                    dice: [8, 8],
                  } as never,
                  roll: {
                    rolls: [],
                    successes: 1,
                  },
                },
                hit: true,
                postHit: undefined,
                targetActorId: "target",
                targetUpdated: false,
              },
              "Scene.scene-1.Token.token-1.Actor.target",
            );

        expect(payload)
          .toEqual(
            expect.objectContaining({
              targetActorId: "target",
              targetActorUuid:
                "Scene.scene-1.Token.token-1.Actor.target",
            }),
          );
      },
    );
  },
);
