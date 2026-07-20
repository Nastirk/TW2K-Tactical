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
  FoundryActorLike,
  FoundryGameLike,
  FoundryUuidResolver,
} from "./foundry-actor-types";
import {
  getPath,
} from "./object-path";

async function resolveWithFoundryGlobal(
  uuid: string,
): Promise<
  FoundryActorLike | null | undefined
> {
  const globalRecord =
    globalThis as unknown as Record<
      string,
      unknown
    >;

  const resolver =
    globalRecord.fromUuid;

  if (
    typeof resolver !==
      "function"
  ) {
    return undefined;
  }

  const resolved =
    await (
      resolver as (
        value: string,
      ) => Promise<unknown>
    )(uuid);

  if (
    !resolved ||
    typeof resolved !==
      "object"
  ) {
    return undefined;
  }

  return resolved as
    FoundryActorLike;
}

export class FoundryActorCombatStateRepository
  implements ActorCombatStateRepository
{
  constructor(
    private readonly game:
      FoundryGameLike,
    private readonly config:
      FoundryActorStateConfig =
        DEFAULT_ACTOR_STATE_CONFIG,
    private readonly resolveUuid:
      FoundryUuidResolver =
        resolveWithFoundryGlobal,
  ) {}

  async get(
    actorId: string,
  ): Promise<ActorCombatState> {
    const actor =
      await this.getActor(actorId);

    const hitCapacity =
      this.readNonNegativeInteger(
        actor,
        this.config.hitCapacityPath,
        0,
      );

    const damage =
      this.readDamage(
        actor,
        hitCapacity,
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
      await this.getActor(actorId);

    const changes:
      Record<string, unknown> = {
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
      };

    if (
      this.config
        .currentHitPointsPath
    ) {
      changes[
        this.config
          .currentHitPointsPath
      ] = Math.max(
        0,
        state.hitCapacity -
          state.damage,
      );
    } else if (
      this.config.damagePath
    ) {
      changes[
        this.config.damagePath
      ] = state.damage;
    } else {
      throw new Error(
        "Foundry actor state config must define damagePath or currentHitPointsPath.",
      );
    }

    await actor.update(changes);
  }

  private readDamage(
    actor: unknown,
    hitCapacity: number,
  ): number {
    if (
      this.config
        .currentHitPointsPath
    ) {
      const currentHitPoints =
        this.readNonNegativeInteger(
          actor,
          this.config
            .currentHitPointsPath,
          hitCapacity,
        );

      return Math.max(
        0,
        hitCapacity -
          currentHitPoints,
      );
    }

    if (this.config.damagePath) {
      return this.readNonNegativeInteger(
        actor,
        this.config.damagePath,
        0,
      );
    }

    return 0;
  }

  private async getActor(
    actorReference: string,
  ): Promise<FoundryActorLike> {
    // Full UUIDs identify synthetic/unlinked token actors. Resolving the UUID
    // first prevents us from accidentally updating a base world actor that
    // happens to share the same actor ID.
    if (
      actorReference.includes(
        ".",
      )
    ) {
      const resolved =
        await this.resolveUuid(
          actorReference,
        );

      if (resolved) {
        return resolved;
      }
    }

    const actor =
      this.game.actors?.get(
        actorReference,
      );

    if (!actor) {
      throw new Error(
        `Actor not found: ${actorReference}`,
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
