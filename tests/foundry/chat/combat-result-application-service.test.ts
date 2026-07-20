import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  ActorCombatState,
} from "../../../src/combat/actor-combat-state";
import type {
  ActorCombatStateRepository,
} from "../../../src/combat/actor-combat-state-repository";
import {
  ActorStateService,
} from "../../../src/combat/actor-state-service";
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
  "CombatResultApplicationService",
  () => {
    it(
      "applies damage, critical injury, and death-save state",
      async () => {
        const repository =
          new MemoryRepository({
            damage: 0,
            hitCapacity: 6,
            incapacitated: false,
            criticalInjuries: [],
          });

        const service =
          new CombatResultApplicationService(
            new ActorStateService(
              repository,
            ),
          );

        await service.apply({
          targetActorId:
            "target",
          finalDamage: 3,
          criticalInjury: {
            roll: 9,
            location: "head",
            injury:
              "Crushed windpipe",
            lethal: true,
            timeLimit: "round",
            effects: [
              "STAMINA -2",
              "MOBILITY -2",
            ],
            healTime:
              "3D6 days",
          },
          deathSaveState: {
            lethal: true,
            instantDeath: false,
            status:
              "required",
            timeLimit:
              "round",
          },
        });

        expect(
          repository.state.damage,
        ).toBe(3);

        expect(
          repository.state
            .criticalInjuries,
        ).toHaveLength(1);

        expect(
          repository.state
            .deathSaveState
            ?.status,
        ).toBe("required");
      },
    );


    it(
      "uses the synthetic actor UUID as the repository reference",
      async () => {
        const actorReferences: string[] = [];

        const repository: ActorCombatStateRepository = {
          async get(actorId) {
            actorReferences.push(
              `get:${actorId}`,
            );
            return {
              damage: 0,
              hitCapacity: 5,
              incapacitated: false,
              criticalInjuries: [],
            };
          },
          async set(actorId) {
            actorReferences.push(
              `set:${actorId}`,
            );
          },
        };

        const service =
          new CombatResultApplicationService(
            new ActorStateService(
              repository,
            ),
          );

        const actorUuid =
          "Scene.scene-1.Token.token-1.Actor.target";

        await service.apply({
          targetActorId: "target",
          targetActorUuid:
            actorUuid,
          finalDamage: 2,
        });

        expect(actorReferences)
          .toEqual([
            `get:${actorUuid}`,
            `set:${actorUuid}`,
          ]);
      },
    );
  },
);
