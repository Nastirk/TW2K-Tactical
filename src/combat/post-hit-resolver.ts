import {
  ArmorResolver,
  type ArmorResolutionResult,
} from "./armor-resolver";
import {
  CriticalInjuryResolver,
  type CriticalInjuryResolutionResult,
} from "./critical-injury-resolver";
import {
  DamageResolver,
  type DamageResolutionResult,
} from "./damage-resolver";
import {
  HitLocationResolver,
  type HitLocation,
} from "./hit-location-resolver";

export interface PostHitResolutionRequest {
  weaponBaseDamage: number;
  extraSuccesses?: number;
  critThreshold: number;
  weaponArmorModifier: number;

  chosenHitLocation?: HitLocation;

  /**
   * Include only body armor that protects the resolved hit location.
   * If several layers apply, only the highest counts.
   */
  bodyArmorLevels?: number[];

  /** Cover OR vehicle armor combined with body armor. */
  externalArmorLevel?: number;
}

export interface PostHitResolutionResult {
  location: HitLocation;
  damage: DamageResolutionResult;
  armor: ArmorResolutionResult;
  criticalInjury:
    CriticalInjuryResolutionResult;
  finalDamage: number;
}

export class PostHitResolver {
  constructor(
    private readonly hitLocationResolver:
      HitLocationResolver,
    private readonly damageResolver:
      DamageResolver,
    private readonly armorResolver:
      ArmorResolver,
    private readonly criticalInjuryResolver:
      CriticalInjuryResolver,
  ) {}

  async resolve(
    request: PostHitResolutionRequest,
  ): Promise<PostHitResolutionResult> {
    const location =
      await this.hitLocationResolver.resolve(
        request.chosenHitLocation,
      );

    const damage =
      this.damageResolver.resolve({
        weaponBaseDamage:
          request.weaponBaseDamage,
        extraSuccesses:
          request.extraSuccesses,
      });

    const armor =
      this.armorResolver.resolve({
        weaponBaseDamage:
          request.weaponBaseDamage,
        incomingDamage:
          damage.damageBeforeArmor,
        weaponArmorModifier:
          request.weaponArmorModifier,
        bodyArmorLevels:
          request.bodyArmorLevels,
        externalArmorLevel:
          request.externalArmorLevel,
      });

    const criticalInjury =
      this.criticalInjuryResolver.resolve({
        damageAfterArmor:
          armor.damageAfterArmor,
        critThreshold:
          request.critThreshold,
      });

    return {
      location,
      damage,
      armor,
      criticalInjury,
      finalDamage:
        armor.damageAfterArmor,
    };
  }
}
