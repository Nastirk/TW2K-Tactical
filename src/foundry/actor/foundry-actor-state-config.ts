export interface FoundryActorStateConfig {
  damagePath: string;
  hitCapacityPath: string;
  incapacitatedPath: string;

  /**
   * Module-owned flags are recommended for custom state.
   * Example:
   * flags.tw2k-tactical.criticalInjuries
   */
  criticalInjuriesPath: string;

  /**
   * Example:
   * flags.tw2k-tactical.deathSaveState
   */
  deathSaveStatePath: string;
}

export const DEFAULT_ACTOR_STATE_CONFIG:
  FoundryActorStateConfig = {
    damagePath:
      "system.health.damage",
    hitCapacityPath:
      "system.health.capacity",
    incapacitatedPath:
      "flags.tw2k-tactical.incapacitated",
    criticalInjuriesPath:
      "flags.tw2k-tactical.criticalInjuries",
    deathSaveStatePath:
      "flags.tw2k-tactical.deathSaveState",
  };
