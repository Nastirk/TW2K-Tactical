/** Twilight: 2000 combat maps use 10 metre range hexes. */
export const T2K_COMBAT_HEX_METERS = 10;

export type T2KGridMeasurementSource =
  | "foundry-path"
  | "hex-coordinate-fallback"
  | "pixel-fallback";

export interface T2KCombatGridEvidence {
  /** Scene-configured distance represented by one Foundry grid space. */
  foundryMetersPerGridSpace: number;
  /** Number of Foundry grid steps between the token centres. */
  foundryGridSteps: number;
  /** Tactical distance represented by those Foundry steps. */
  foundryDistanceMeters: number;
  /** Always 10m for the core T2K combat abstraction. */
  t2kMetersPerCombatHex: number;
  /** Number of Foundry grid spaces which equal one T2K 10m range hex. */
  foundrySpacesPerT2KHex: number;
  /** How the Foundry distance was measured. */
  measurementSource: T2KGridMeasurementSource;
}

function assertFiniteNonNegative(
  value: number,
  name: string,
): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a finite non-negative number.`);
  }
}

function assertFinitePositive(
  value: number,
  name: string,
): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive finite number.`);
  }
}

/**
 * Convert a Foundry tactical distance into the 10m range units used by the
 * Twilight: 2000 combat rules.
 *
 * A Scene configured as 2m per Foundry hex therefore uses five Foundry grid
 * steps per T2K range hex:
 *
 * - 0-4 Foundry steps (0-8m) => same T2K hex (distance 0)
 * - 5-9 Foundry steps (10-18m) => distance 1 T2K hex
 * - 10-14 Foundry steps (20-28m) => distance 2 T2K hexes
 */
export function convertFoundryDistanceToT2KHexes(
  foundryDistanceMeters: number,
): number {
  assertFiniteNonNegative(
    foundryDistanceMeters,
    "foundryDistanceMeters",
  );

  // The epsilon avoids a value such as 9.999999999999998 being treated as
  // below an exact 10m boundary because of floating-point representation.
  return Math.floor(
    (foundryDistanceMeters + Number.EPSILON * 100) /
      T2K_COMBAT_HEX_METERS,
  );
}

export function convertFoundryStepsToT2KHexes(
  foundryGridSteps: number,
  foundryMetersPerGridSpace: number,
): number {
  assertFiniteNonNegative(foundryGridSteps, "foundryGridSteps");
  assertFinitePositive(
    foundryMetersPerGridSpace,
    "foundryMetersPerGridSpace",
  );

  return convertFoundryDistanceToT2KHexes(
    foundryGridSteps * foundryMetersPerGridSpace,
  );
}

export function getFoundrySpacesPerT2KHex(
  foundryMetersPerGridSpace: number,
): number {
  assertFinitePositive(
    foundryMetersPerGridSpace,
    "foundryMetersPerGridSpace",
  );

  return T2K_COMBAT_HEX_METERS / foundryMetersPerGridSpace;
}
