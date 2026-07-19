import type {
  CriticalInjuryEntry,
} from "./critical-injury-table";
import type {
  DeathSaveState,
} from "./death-save-state";
import type {
  ActorCombatState,
} from "./actor-combat-state";
import type {
  ActorCombatStateRepository,
} from "./actor-combat-state-repository";

export interface ApplyDamageRequest {
  actorId: string;
  damage: number;
}

export class ActorStateService {
  constructor(
    private readonly repository:
      ActorCombatStateRepository,
  ) {}

  async applyDamage(
    request: ApplyDamageRequest,
  ): Promise<ActorCombatState> {
    if (
      !Number.isInteger(
        request.damage,
      ) ||
      request.damage < 0
    ) {
      throw new Error(
        "damage must be a non-negative integer.",
      );
    }

    const state =
      await this.repository.get(
        request.actorId,
      );

    const damage =
      state.damage +
      request.damage;

    const next: ActorCombatState = {
      ...state,
      damage,
      incapacitated:
        damage >=
        state.hitCapacity,
    };

    await this.repository.set(
      request.actorId,
      next,
    );

    return next;
  }

  async addCriticalInjury(
    actorId: string,
    injury: CriticalInjuryEntry,
  ): Promise<ActorCombatState> {
    const state =
      await this.repository.get(
        actorId,
      );

    const next: ActorCombatState = {
      ...state,
      criticalInjuries: [
        ...state.criticalInjuries,
        injury,
      ],
    };

    await this.repository.set(
      actorId,
      next,
    );

    return next;
  }

  async setDeathSaveState(
    actorId: string,
    deathSaveState:
      DeathSaveState,
  ): Promise<ActorCombatState> {
    const state =
      await this.repository.get(
        actorId,
      );

    const next: ActorCombatState = {
      ...state,
      deathSaveState,
    };

    await this.repository.set(
      actorId,
      next,
    );

    return next;
  }
}
