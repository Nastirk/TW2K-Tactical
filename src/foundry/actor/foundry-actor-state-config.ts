export interface FoundryActorStateConfig {
  /**
   * Optional path for systems that persist accumulated damage directly.
   * When currentHitPointsPath is configured, the repository derives damage
   * from hit capacity minus current HP instead of reading this path.
   */
  damagePath?: string;

  /**
   * Optional path to the actor's current visible hit points.
   * T2K4E 14.x uses system.health.value.
   */
  currentHitPointsPath?: string;

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
    currentHitPointsPath:
      "system.health.value",
    hitCapacityPath:
      "system.health.max",
    incapacitatedPath:
      "flags.tw2k-tactical.incapacitated",
    criticalInjuriesPath:
      "flags.tw2k-tactical.criticalInjuries",
    deathSaveStatePath:
      "flags.tw2k-tactical.deathSaveState",
  };
