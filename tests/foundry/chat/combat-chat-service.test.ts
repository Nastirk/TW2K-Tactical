import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  CombatChatService,
} from "../../../src/foundry/chat/combat-chat-service";
import {
  FoundryChatMessagePublisher,
} from "../../../src/foundry/chat/foundry-chat-message-publisher";
import {
  CombatChatCardRenderer,
} from "../../../src/ui/combat-chat-card-renderer";
import {
  CombatChatCardViewModelFactory,
} from "../../../src/ui/combat-chat-card-view-model-factory";

describe(
  "CombatChatService",
  () => {
    it(
      "publishes an end-to-end result",
      async () => {
        const create =
          vi.fn()
            .mockResolvedValue(
              {},
            );

        const service =
          new CombatChatService(
            new CombatChatCardViewModelFactory(),
            new CombatChatCardRenderer(),
            new FoundryChatMessagePublisher({
              create,
            }),
          );

        await service.publish({
          result: {
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
                size: 2,
              } as never,
              modifiers: [],
              netModifier: 0,
              finalPool: {
                dice: [8, 8],
                size: 2,
              } as never,
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
                penetrated: false,
                damageAfterArmor: 2,
                ablationCheckRequired:
                  false,
              },
              criticalInjury: {
                triggered: false,
                d10Count: 0,
                damageOverThreshold: 0,
              },
              finalDamage: 2,
            },
            targetUpdated: true,
          },
          names: {
            attackerName:
              "Attacker",
            targetName:
              "Target",
            weaponName:
              "Rifle",
          },
          targetActorId:
            "target",
        });

        expect(
          create,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          create.mock.calls[0][0]
            .content,
        ).toContain("HIT");
      },
    );
  },
);
