import {
  ArmorResolver,
  type ArmorProtection,
  type ArmorResolutionResult,
} from "./armor-resolver";
import {
  HitLocationResolver,
  type HitLocation,
} from "./hit-location-resolver";

export interface DamageResolutionRequest {
  baseDamage: number;
  extraSuccesses?: number;
  damagePerExtraSuccess?: number;
  armor?: ArmorProtection;
  armorPiercing?: number;
}

export interface DamageResolutionResult {
  location: HitLocation;
  baseDamage: number;
  extraSuccesses: number;
  damageBeforeArmor: number;
  armor: ArmorResolutionResult;
  finalDamage: number;
}

export class DamageResolver {
  constructor(
    private readonly hitLocationResolver:
      HitLocationResolver,
    private readonly armorResolver:
      ArmorResolver,
  ) {}

  async resolve(
    request: DamageResolutionRequest,
  ): Promise<DamageResolutionResult> {
    if (
      !Number.isInteger(request.baseDamage) ||
      request.baseDamage < 0
    ) {
      throw new Error(
        "Base damage must be a non-negative integer.",
      );
    }

    const extraSuccesses = Math.max(
      0,
      request.extraSuccesses ?? 0,
    );

    const damagePerExtraSuccess = Math.max(
      0,
      request.damagePerExtraSuccess ?? 1,
    );

    const damageBeforeArmor =
      request.baseDamage +
      extraSuccesses * damagePerExtraSuccess;

    const location =
      await this.hitLocationResolver.resolve();

    const armor = this.armorResolver.resolve({
      location,
      incomingDamage: damageBeforeArmor,
      armor: request.armor,
      armorPiercing: request.armorPiercing,
    });

    return {
      location,
      baseDamage: request.baseDamage,
      extraSuccesses,
      damageBeforeArmor,
      armor,
      finalDamage: armor.damageAfterArmor,
    };
  }
}
