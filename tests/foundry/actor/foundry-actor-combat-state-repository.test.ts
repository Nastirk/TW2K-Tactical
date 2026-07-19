import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  FoundryActorCombatStateRepository,
} from "../../../src/foundry/actor/foundry-actor-combat-state-repository";

describe(
  "FoundryActorCombatStateRepository",
  () => {
    it(
      "reads actor combat state from configured paths",
      async () => {
        const actor = {
          id: "actor-1",
          system: {
            health: {
              damage: 2,
              capacity: 5,
            },
          },
          flags: {
            tactical: {
              incapacitated:
                false,
              criticalInjuries:
                [],
            },
          },
          update:
            vi.fn(),
        };

        const repository =
          new FoundryActorCombatStateRepository(
            {
              actors: {
                get: () => actor,
              },
            },
            {
              damagePath:
                "system.health.damage",
              hitCapacityPath:
                "system.health.capacity",
              incapacitatedPath:
                "flags.tactical.incapacitated",
              criticalInjuriesPath:
                "flags.tactical.criticalInjuries",
              deathSaveStatePath:
                "flags.tactical.deathSaveState",
            },
          );

        const result =
          await repository.get(
            "actor-1",
          );

        expect(
          result.damage,
        ).toBe(2);

        expect(
          result.hitCapacity,
        ).toBe(5);
      },
    );

    it(
      "writes flattened Foundry update paths",
      async () => {
        const update =
          vi.fn()
            .mockResolvedValue(
              undefined,
            );

        const actor = {
          id: "actor-1",
          update,
        };

        const repository =
          new FoundryActorCombatStateRepository(
            {
              actors: {
                get: () => actor,
              },
            },
            {
              damagePath:
                "system.damage",
              hitCapacityPath:
                "system.capacity",
              incapacitatedPath:
                "flags.tactical.incapacitated",
              criticalInjuriesPath:
                "flags.tactical.criticalInjuries",
              deathSaveStatePath:
                "flags.tactical.deathSaveState",
            },
          );

        await repository.set(
          "actor-1",
          {
            damage: 3,
            hitCapacity: 5,
            incapacitated: false,
            criticalInjuries: [],
          },
        );

        expect(
          update,
        ).toHaveBeenCalledWith({
          "system.damage": 3,
          "flags.tactical.incapacitated":
            false,
          "flags.tactical.criticalInjuries":
            [],
          "flags.tactical.deathSaveState":
            null,
        });
      },
    );

    it(
      "throws when the actor is missing",
      async () => {
        const repository =
          new FoundryActorCombatStateRepository(
            {
              actors: {
                get: () =>
                  undefined,
              },
            },
          );

        await expect(
          repository.get(
            "missing",
          ),
        ).rejects.toThrow(
          "Actor not found: missing",
        );
      },
    );
  },
);
