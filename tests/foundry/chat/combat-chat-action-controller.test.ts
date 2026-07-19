import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  ActorStateService,
} from "../../../src/combat/actor-state-service";
import type {
  ActorCombatState,
} from "../../../src/combat/actor-combat-state";
import type {
  ActorCombatStateRepository,
} from "../../../src/combat/actor-combat-state-repository";
import {
  CombatChatActionController,
} from "../../../src/foundry/chat/combat-chat-action-controller";
import {
  InMemoryCombatActionIdempotency,
} from "../../../src/foundry/chat/combat-action-idempotency";
import {
  CombatResultApplicationService,
} from "../../../src/foundry/chat/combat-result-application-service";

class MemoryRepository
  implements ActorCombatStateRepository
{
  constructor(
    public state:
      ActorCombatState,
  ) {}

  async get():
    Promise<ActorCombatState> {
    return structuredClone(
      this.state,
    );
  }

  async set(
    _actorId: string,
    state:
      ActorCombatState,
  ): Promise<void> {
    this.state =
      structuredClone(state);
  }
}

describe(
  "CombatChatActionController",
  () => {
    it(
      "applies a staged chat result once",
      async () => {
        const repository =
          new MemoryRepository({
            damage: 0,
            hitCapacity: 5,
            incapacitated: false,
            criticalInjuries: [],
          });

        const update =
          vi.fn()
            .mockResolvedValue(
              undefined,
            );

        const controller =
          new CombatChatActionController(
            new CombatResultApplicationService(
              new ActorStateService(
                repository,
              ),
            ),
            {
              canApplyResult:
                () => true,
            },
            new InMemoryCombatActionIdempotency(),
          );

        const message = {
          id: "message-1",
          flags: {
            "tw2k-tactical": {
              combatResult: {
                targetActorId:
                  "target",
                finalDamage: 2,
              },
            },
          },
          update,
        };

        await controller
          .applyResult({
            message,
          });

        expect(
          repository.state.damage,
        ).toBe(2);

        expect(
          update,
        ).toHaveBeenCalledWith({
          "flags.tw2k-tactical.applied":
            true,
        });

        await expect(
          controller.applyResult({
            message,
          }),
        ).rejects.toThrow(
          "Combat result has already been applied.",
        );
      },
    );

    it(
      "rejects unauthorized application",
      async () => {
        const repository =
          new MemoryRepository({
            damage: 0,
            hitCapacity: 5,
            incapacitated: false,
            criticalInjuries: [],
          });

        const controller =
          new CombatChatActionController(
            new CombatResultApplicationService(
              new ActorStateService(
                repository,
              ),
            ),
            {
              canApplyResult:
                () => false,
            },
            new InMemoryCombatActionIdempotency(),
          );

        await expect(
          controller.applyResult({
            message: {
              id: "message-2",
              flags: {
                "tw2k-tactical": {
                  combatResult: {
                    targetActorId:
                      "target",
                    finalDamage: 2,
                  },
                },
              },
            },
          }),
        ).rejects.toThrow(
          "You do not have permission to apply this combat result.",
        );
      },
    );
  },
);
