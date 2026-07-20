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
      "maps real T2K4E current HP to accumulated tactical damage",
      async () => {
        const actor = {
          id: "actor-1",
          system: {
            health: {
              value: 5,
              max: 5,
              modifier: 0,
              trauma: 0,
              temp: 0,
              // A stale value written by v0.23 must not drive tactical damage.
              damage: 2,
            },
          },
          flags: {
            "tw2k-tactical": {
              incapacitated:
                false,
              criticalInjuries:
                [],
              deathSaveState:
                null,
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
          );

        const result =
          await repository.get(
            "actor-1",
          );

        expect(result.damage)
          .toBe(0);
        expect(result.hitCapacity)
          .toBe(5);
      },
    );

    it(
      "reduces real T2K4E visible HP when tactical damage is persisted",
      async () => {
        const update =
          vi.fn()
            .mockResolvedValue(
              undefined,
            );

        const actor = {
          id: "actor-1",
          system: {
            health: {
              value: 5,
              max: 5,
              damage: 0,
            },
          },
          update,
        };

        const repository =
          new FoundryActorCombatStateRepository(
            {
              actors: {
                get: () => actor,
              },
            },
          );

        await repository.set(
          "actor-1",
          {
            damage: 2,
            hitCapacity: 5,
            incapacitated: false,
            criticalInjuries: [],
          },
        );

        expect(update)
          .toHaveBeenCalledWith({
            "system.health.value": 3,
            "flags.tw2k-tactical.incapacitated":
              false,
            "flags.tw2k-tactical.criticalInjuries":
              [],
            "flags.tw2k-tactical.deathSaveState":
              null,
          });
      },
    );

    it(
      "clamps T2K4E visible HP at zero",
      async () => {
        const update =
          vi.fn()
            .mockResolvedValue(
              undefined,
            );

        const repository =
          new FoundryActorCombatStateRepository(
            {
              actors: {
                get: () => ({
                  id: "actor-1",
                  update,
                }),
              },
            },
          );

        await repository.set(
          "actor-1",
          {
            damage: 9,
            hitCapacity: 5,
            incapacitated: true,
            criticalInjuries: [],
          },
        );

        expect(update)
          .toHaveBeenCalledWith(
            expect.objectContaining({
              "system.health.value": 0,
            }),
          );
      },
    );

    it(
      "retains direct-damage-path support for custom Foundry integrations",
      async () => {
        const update =
          vi.fn()
            .mockResolvedValue(
              undefined,
            );

        const actor = {
          id: "actor-1",
          system: {
            damage: 2,
            capacity: 5,
          },
          flags: {
            tactical: {
              incapacitated:
                false,
              criticalInjuries:
                [],
            },
          },
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

        const state =
          await repository.get(
            "actor-1",
          );

        expect(state.damage)
          .toBe(2);
        expect(state.hitCapacity)
          .toBe(5);

        await repository.set(
          "actor-1",
          {
            ...state,
            damage: 3,
          },
        );

        expect(update)
          .toHaveBeenCalledWith({
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

    it(
      "resolves a synthetic token actor UUID before falling back to world actors",
      async () => {
        const update =
          vi.fn()
            .mockResolvedValue(
              undefined,
            );

        const syntheticActor = {
          id: "actor-1",
          uuid:
            "Scene.scene-1.Token.token-1.Actor.actor-1",
          system: {
            health: {
              value: 5,
              max: 5,
            },
          },
          update,
        };

        const getWorldActor =
          vi.fn(() => ({
            id: "actor-1",
            system: {
              health: {
                value: 5,
                max: 5,
              },
            },
            update: vi.fn(),
          }));

        const resolveUuid =
          vi.fn()
            .mockResolvedValue(
              syntheticActor,
            );

        const repository =
          new FoundryActorCombatStateRepository(
            {
              actors: {
                get:
                  getWorldActor,
              },
            },
            undefined,
            resolveUuid,
          );

        const actorUuid =
          "Scene.scene-1.Token.token-1.Actor.actor-1";

        const state =
          await repository.get(
            actorUuid,
          );

        await repository.set(
          actorUuid,
          {
            ...state,
            damage: 2,
          },
        );

        expect(resolveUuid)
          .toHaveBeenCalledWith(
            actorUuid,
          );
        expect(getWorldActor)
          .not.toHaveBeenCalled();
        expect(update)
          .toHaveBeenCalledWith(
            expect.objectContaining({
              "system.health.value": 3,
            }),
          );
      },
    );
  },
);
