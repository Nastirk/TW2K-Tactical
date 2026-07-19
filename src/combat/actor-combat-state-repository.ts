import type {
  ActorCombatState,
} from "./actor-combat-state";

export interface ActorCombatStateRepository {
  get(
    actorId: string,
  ): Promise<ActorCombatState>;

  set(
    actorId: string,
    state: ActorCombatState,
  ): Promise<void>;
}
