import type { FoundryLiveAttackSelection } from "../combat/foundry-live-attack-types";

type UnknownRecord = Record<string, unknown>;

const EXPECTED_SYSTEM_ID = "t2k4e";

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object"
    ? value as UnknownRecord
    : null;
}

function readPath(source: unknown, path: readonly string[]): unknown {
  let current: unknown = source;

  for (const segment of path) {
    const record = asRecord(current);
    if (!record) {
      return undefined;
    }

    current = record[segment];
  }

  return current;
}

function readString(source: unknown, paths: readonly (readonly string[])[]): string | undefined {
  for (const path of paths) {
    const value = readPath(source, path);

    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return undefined;
}

function countIterable(value: unknown): number {
  if (!value || typeof value !== "object" || !(Symbol.iterator in value)) {
    return 0;
  }

  try {
    return Array.from(value as Iterable<unknown>).length;
  } catch {
    return 0;
  }
}

export interface FoundryT2K4ECompatibilityReport {
  ok: boolean;
  expectedSystemId: typeof EXPECTED_SYSTEM_ID;
  systemId?: string;
  systemVersion?: string;
  foundryVersion?: string;
  canvasReady: boolean;
  gridReady: boolean;
  targetCount: number;
  controlledTokenCount: number;
  issues: string[];
  warnings: string[];
}

export interface FoundryAttackSelectionValidator {
  assertAttackSelection(selection: FoundryLiveAttackSelection): void;
}

export class FoundryT2K4ECompatibilityService
  implements FoundryAttackSelectionValidator
{
  constructor(
    private readonly getGame: () => unknown,
    private readonly getCanvas: () => unknown,
  ) {}

  inspect(): FoundryT2K4ECompatibilityReport {
    const game = this.getGame();
    const canvas = this.getCanvas();

    const systemId = readString(game, [
      ["system", "id"],
      ["systemId"],
    ]);

    const systemVersion = readString(game, [
      ["system", "version"],
      ["system", "data", "version"],
    ]);

    const foundryVersion = readString(game, [
      ["version"],
      ["release", "version"],
    ]);

    const targetCount = countIterable(
      readPath(game, ["user", "targets"]),
    );

    const controlled = readPath(canvas, ["tokens", "controlled"]);
    const controlledTokenCount = Array.isArray(controlled)
      ? controlled.length
      : countIterable(controlled);

    const canvasReady = Boolean(canvas);
    const gridReady = Boolean(readPath(canvas, ["grid"]));

    const issues: string[] = [];
    const warnings: string[] = [];

    if (systemId && systemId !== EXPECTED_SYSTEM_ID) {
      issues.push(
        `Expected Foundry system '${EXPECTED_SYSTEM_ID}', but '${systemId}' is active.`,
      );
    }

    if (!systemId) {
      warnings.push("Unable to determine the active Foundry game system ID.");
    }

    if (!canvasReady) {
      warnings.push("The active canvas is not ready.");
    } else if (!gridReady) {
      warnings.push("The active canvas grid is unavailable.");
    }

    if (targetCount === 0) {
      warnings.push("No target is currently selected.");
    } else if (targetCount > 1) {
      warnings.push("TW2K Tactical attacks currently require exactly one targeted token.");
    }

    return {
      ok: issues.length === 0,
      expectedSystemId: EXPECTED_SYSTEM_ID,
      systemId,
      systemVersion,
      foundryVersion,
      canvasReady,
      gridReady,
      targetCount,
      controlledTokenCount,
      issues,
      warnings,
    };
  }

  assertAttackSelection(selection: FoundryLiveAttackSelection): void {
    const report = this.inspect();

    if (report.systemId && report.systemId !== EXPECTED_SYSTEM_ID) {
      throw new Error(report.issues[0]);
    }

    const attackerId = readString(selection.attackerActor, [["id"], ["_id"]]);
    const targetId = readString(selection.targetActor, [["id"], ["_id"]]);
    const weaponId = readString(selection.weapon, [["id"], ["_id"]]);

    if (!attackerId) {
      throw new Error("The attacking T2K4E actor does not expose an id.");
    }

    if (!targetId) {
      throw new Error("The targeted T2K4E actor does not expose an id.");
    }

    if (!weaponId) {
      throw new Error("The selected T2K4E weapon does not expose an id.");
    }

    const weaponType = readString(selection.weapon, [["type"]]);

    if (weaponType && weaponType.toLowerCase() !== "weapon") {
      throw new Error(
        `TW2K Tactical expected a T2K4E weapon item, but received item type '${weaponType}'.`,
      );
    }
  }
}
