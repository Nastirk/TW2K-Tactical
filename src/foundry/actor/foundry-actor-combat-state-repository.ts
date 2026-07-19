import type {
  ActorCombatState,
} from "../../combat/actor-combat-state";
import type {
  ActorCombatStateRepository,
} from "../../combat/actor-combat-state-repository";
import type {
  CriticalInjuryEntry,
} from "../../combat/critical-injury-table";
import type {
  DeathSaveState,
} from "../../combat/death-save-state";
import {
  DEFAULT_ACTOR_STATE_CONFIG,
  type FoundryActorStateConfig,
} from "./foundry-actor-state-config";
import type {
  FoundryGameLike,
} from "./foundry-actor-types";
import {
  getPath,
} from "./object-path";

export class FoundryActorCombatStateRepository
  implements ActorCombatStateRepository
{
  constructor(
    private readonly game:
      FoundryGameLike,
    private readonly config:
      FoundryActorStateConfig =
        DEFAULT_ACTOR_STATE_CONFIG,
  ) {}

  async get(
    actorId: string,
  ): Promise<ActorCombatState> {
    const actor =
      this.getActor(actorId);

    const damage =
      this.readNonNegativeInteger(
        actor,
        this.config.damagePath,
        0,
      );

    const hitCapacity =
      this.readNonNegativeInteger(
        actor,
        this.config.hitCapacityPath,
        0,
      );

    const incapacitated =
      Boolean(
        getPath(
          actor,
          this.config
            .incapacitatedPath,
        ),
      ) ||
      damage >= hitCapacity;

    const criticalInjuries =
      this.readArray<
        CriticalInjuryEntry
      >(
        actor,
        this.config
          .criticalInjuriesPath,
      );

    const deathSaveState =
      getPath(
        actor,
        this.config
          .deathSaveStatePath,
      ) as
        | DeathSaveState
        | undefined;

    return {
      damage,
      hitCapacity,
      incapacitated,
      criticalInjuries,
      deathSaveState,
    };
  }

  async set(
    actorId: string,
    state: ActorCombatState,
  ): Promise<void> {
    const actor =
      this.getActor(actorId);

    await actor.update({
      [this.config.damagePath]:
        state.damage,
      [this.config
        .incapacitatedPath]:
        state.incapacitated,
      [this.config
        .criticalInjuriesPath]:
        state.criticalInjuries,
      [this.config
        .deathSaveStatePath]:
        state.deathSaveState ??
        null,
    });
  }

  private getActor(
    actorId: string,
  ) {
    const actor =
      this.game.actors?.get(
        actorId,
      );

    if (!actor) {
      throw new Error(
        `Actor not found: ${actorId}`,
      );
    }

    return actor;
  }

  private readNonNegativeInteger(
    source: unknown,
    path: string,
    fallback: number,
  ): number {
    const value =
      getPath(source, path);

    return (
      Number.isInteger(value) &&
      (value as number) >= 0
    )
      ? (value as number)
      : fallback;
  }

  private readArray<T>(
    source: unknown,
    path: string,
  ): T[] {
    const value =
      getPath(source, path);

    return Array.isArray(value)
      ? [...value] as T[]
      : [];
  }
}
