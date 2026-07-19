export interface ArmorResolutionRequest {
  /** Weapon's printed base damage rating. */
  weaponBaseDamage: number;

  /** Damage after adding extra successes, before armor/cover. */
  incomingDamage: number;

  /** Weapon armor modifier, e.g. -1, 0, +1. */
  weaponArmorModifier: number;

  /**
   * Armor levels of body-armor layers that actually protect the hit location.
   * Only the highest layer counts.
   */
  bodyArmorLevels?: number[];

  /**
   * One additional armor source such as cover or vehicle armor.
   * This is added to the effective body-armor layer.
   */
  externalArmorLevel?: number;
}

export interface ArmorResolutionResult {
  incomingDamage: number;
  bodyArmorLevel: number;
  externalArmorLevel: number;
  combinedArmorLevel: number;
  weaponArmorModifier: number;
  modifiedArmorLevel: number;
  fullyDeflectedByPenetrationLimit: boolean;
  penetrated: boolean;
  damageAfterArmor: number;
  ablationCheckRequired: boolean;
}

export class ArmorResolver {
  resolve(
    request: ArmorResolutionRequest,
  ): ArmorResolutionResult {
    this.assertNonNegativeInteger(
      request.weaponBaseDamage,
      "weaponBaseDamage",
    );
    this.assertNonNegativeInteger(
      request.incomingDamage,
      "incomingDamage",
    );

    if (
      !Number.isInteger(
        request.weaponArmorModifier,
      )
    ) {
      throw new Error(
        "weaponArmorModifier must be an integer.",
      );
    }

    const bodyArmorLevels =
      request.bodyArmorLevels ?? [];

    for (
      const level of bodyArmorLevels
    ) {
      this.assertNonNegativeInteger(
        level,
        "bodyArmorLevels",
      );
    }

    const bodyArmorLevel =
      bodyArmorLevels.length > 0
        ? Math.max(...bodyArmorLevels)
        : 0;

    const externalArmorLevel =
      request.externalArmorLevel ?? 0;

    this.assertNonNegativeInteger(
      externalArmorLevel,
      "externalArmorLevel",
    );

    const combinedArmorLevel =
      bodyArmorLevel +
      externalArmorLevel;

    const modifiedArmorLevel =
      combinedArmorLevel > 0
        ? Math.max(
            0,
            combinedArmorLevel +
              request.weaponArmorModifier,
          )
        : 0;

    const fullyDeflectedByPenetrationLimit =
      modifiedArmorLevel >=
      request.weaponBaseDamage + 2;

    const damageAfterArmor =
      fullyDeflectedByPenetrationLimit
        ? 0
        : Math.max(
            0,
            request.incomingDamage -
              modifiedArmorLevel,
          );

    const penetrated =
      combinedArmorLevel > 0 &&
      damageAfterArmor > 0;

    return {
      incomingDamage:
        request.incomingDamage,
      bodyArmorLevel,
      externalArmorLevel,
      combinedArmorLevel,
      weaponArmorModifier:
        request.weaponArmorModifier,
      modifiedArmorLevel,
      fullyDeflectedByPenetrationLimit,
      penetrated,
      damageAfterArmor,
      ablationCheckRequired:
        penetrated,
    };
  }

  private assertNonNegativeInteger(
    value: number,
    name: string,
  ): void {
    if (
      !Number.isInteger(value) ||
      value < 0
    ) {
      throw new Error(
        `${name} must be a non-negative integer.`,
      );
    }
  }
}
