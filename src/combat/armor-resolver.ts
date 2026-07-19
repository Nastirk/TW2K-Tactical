import type { HitLocation } from "./hit-location-resolver";

export interface ArmorProtection {
  location: HitLocation;
  rating: number;
}

export interface ArmorResolutionRequest {
  location: HitLocation;
  incomingDamage: number;
  armor?: ArmorProtection;
  armorPiercing?: number;
}

export interface ArmorResolutionResult {
  location: HitLocation;
  incomingDamage: number;
  armorRating: number;
  armorPiercing: number;
  effectiveArmor: number;
  damageAfterArmor: number;
}

export class ArmorResolver {
  resolve(
    request: ArmorResolutionRequest,
  ): ArmorResolutionResult {
    if (request.incomingDamage < 0) {
      throw new Error("Incoming damage cannot be negative.");
    }

    const armorRating =
      request.armor?.location === request.location
        ? request.armor.rating
        : 0;

    const armorPiercing = Math.max(
      0,
      request.armorPiercing ?? 0,
    );

    const effectiveArmor = Math.max(
      0,
      armorRating - armorPiercing,
    );

    const damageAfterArmor = Math.max(
      0,
      request.incomingDamage - effectiveArmor,
    );

    return {
      location: request.location,
      incomingDamage: request.incomingDamage,
      armorRating,
      armorPiercing,
      effectiveArmor,
      damageAfterArmor,
    };
  }
}
