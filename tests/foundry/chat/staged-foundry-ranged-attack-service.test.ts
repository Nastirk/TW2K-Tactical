import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  CombatChatCardRenderer,
} from "../../../src/ui/combat-chat-card-renderer";
import {
  CombatResultPayloadFactory,
} from "../../../src/foundry/chat/combat-result-payload-factory";
import {
  FoundryChatMessagePublisher,
} from "../../../src/foundry/chat/foundry-chat-message-publisher";
import {
  StagedCombatChatViewModelFactory,
} from "../../../src/foundry/chat/staged-combat-chat-view-model-factory";
import {
  StagedFoundryRangedAttackService,
} from "../../../src/foundry/chat/staged-foundry-ranged-attack-service";

describe(
  "StagedFoundryRangedAttackService",
  () => {
    it(
      "publishes a staged result payload without applying actor state",
      async () => {
        const create =
          vi.fn()
            .mockResolvedValue(
              {},
            );

        const workflow = {
          resolve:
            vi.fn()
              .mockResolvedValue({
                attack: {
                  context: {
                    attackerId:
                      "a",
                    targetId:
                      "t",
                    weaponId:
                      "w",
                    distanceHexes:
                      1,
                    combatMode:
                      "ranged",
                    rangeBand:
                      "short",
                    sameHex:
                      false,
                  },
                  basePool: {
                    dice:
                      [8, 8],
                  },
                  modifiers: [],
                  netModifier: 0,
                  finalPool: {
                    dice:
                      [8, 8],
                  },
                  roll: {
                    rolls: [
                      {
                        sides: 8,
                        value: 6,
                      },
                      {
                        sides: 8,
                        value: 2,
                      },
                    ],
                    successes: 1,
                  },
                },
                hit: true,
                postHit: {
                  location:
                    "torso",
                  damage: {
                    weaponBaseDamage:
                      2,
                    extraSuccesses:
                      0,
                    damageBeforeArmor:
                      2,
                  },
                  armor: {
                    incomingDamage:
                      2,
                    bodyArmorLevel:
                      0,
                    externalArmorLevel:
                      0,
                    combinedArmorLevel:
                      0,
                    weaponArmorModifier:
                      0,
                    modifiedArmorLevel:
                      0,
                    fullyDeflectedByPenetrationLimit:
                      false,
                    penetrated:
                      false,
                    damageAfterArmor:
                      2,
                    ablationCheckRequired:
                      false,
                  },
                  criticalInjury: {
                    triggered:
                      false,
                    d10Count: 0,
                    damageOverThreshold:
                      0,
                  },
                  finalDamage: 2,
                },
                targetActorId:
                  "target",
                targetUpdated:
                  false,
              }),
        };

        const service =
          new StagedFoundryRangedAttackService(
            workflow as never,
            new StagedCombatChatViewModelFactory(),
            new CombatChatCardRenderer(),
            new CombatResultPayloadFactory(),
            new FoundryChatMessagePublisher({
              create,
            }),
          );

        const result =
          await service.execute({
            combat: {
              attackerId: "a",
              targetId: "t",
              targetActorId:
                "target",
              weaponId: "w",
              baseAttributeDie:
                8,
              baseSkillDie: 8,
              weaponBaseDamage:
                2,
              critThreshold: 3,
              weaponArmorModifier:
                0,
            },
            names: {
              attackerName:
                "Attacker",
              targetName:
                "Target",
              weaponName:
                "Rifle",
            },
            targetActorUuid:
              "Scene.scene-1.Token.token-1.Actor.target",
          });

        expect(
          result.targetUpdated,
        ).toBe(false);

        expect(
          create,
        ).toHaveBeenCalledTimes(
          1,
        );

        const message =
          create.mock.calls[0][0];

        expect(
          message
            .flags[
              "tw2k-tactical"
            ]
            .combatResult,
        ).toEqual({
          targetActorId:
            "target",
          targetActorUuid:
            "Scene.scene-1.Token.token-1.Actor.target",
          finalDamage: 2,
          criticalInjury:
            undefined,
          deathSaveState:
            undefined,
        });
      },
    );
  },
);
