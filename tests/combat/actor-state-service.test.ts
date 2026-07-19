import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  ActorCombatState,
} from "../../src/combat/actor-combat-state";
import type {
  ActorCombatStateRepository,
} from "../../src/combat/actor-combat-state-repository";
import {
  ActorStateService,
} from "../../src/combat/actor-state-service";

class MemoryRepository
  implements ActorCombatStateRepository
{
  constructor(
    public state:
      ActorCombatState,
  ) {}

  async get(): Promise<
    ActorCombatState
  > {
    return structuredClone(
      this.state,
    );
  }

  async set(
    _actorId: string,
    state: ActorCombatState,
  ): Promise<void> {
    this.state =
      structuredClone(state);
  }
}

describe("ActorStateService", () => {
  it(
    "applies damage",
    async () => {
      const repository =
        new MemoryRepository({
          damage: 1,
          hitCapacity: 5,
          incapacitated: false,
          criticalInjuries: [],
        });

      const service =
        new ActorStateService(
          repository,
        );

      const result =
        await service.applyDamage({
          actorId: "a",
          damage: 2,
        });

      expect(result.damage).toBe(
        3,
      );

      expect(
        result.incapacitated,
      ).toBe(false);
    },
  );

  it(
    "incapacitates when damage reaches hit capacity",
    async () => {
      const repository =
        new MemoryRepository({
          damage: 3,
          hitCapacity: 5,
          incapacitated: false,
          criticalInjuries: [],
        });

      const service =
        new ActorStateService(
          repository,
        );

      const result =
        await service.applyDamage({
          actorId: "a",
          damage: 2,
        });

      expect(
        result.incapacitated,
      ).toBe(true);
    },
  );

  it(
    "records critical injuries",
    async () => {
      const repository =
        new MemoryRepository({
          damage: 0,
          hitCapacity: 5,
          incapacitated: false,
          criticalInjuries: [],
        });

      const service =
        new ActorStateService(
          repository,
        );

      const result =
        await service
          .addCriticalInjury(
            "a",
            {
              roll: 1,
              location: "head",
              injury:
                "Ear slashed",
              lethal: false,
              timeLimit: null,
              effects: [
                "RECON -1",
              ],
              healTime:
                "D6 days",
            },
          );

      expect(
        result
          .criticalInjuries,
      ).toHaveLength(1);
    },
  );

  it(
    "stores death-save state",
    async () => {
      const repository =
        new MemoryRepository({
          damage: 0,
          hitCapacity: 5,
          incapacitated: false,
          criticalInjuries: [],
        });

      const service =
        new ActorStateService(
          repository,
        );

      const result =
        await service
          .setDeathSaveState(
            "a",
            {
              lethal: true,
              instantDeath: false,
              status:
                "required",
              timeLimit:
                "stretch",
            },
          );

      expect(
        result
          .deathSaveState
          ?.status,
      ).toBe("required");
    },
  );
});
