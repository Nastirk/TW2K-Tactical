import type { AttackRequest } from "../../combat/attack-request";
import type { RangeBand } from "../../combat/attack-context";
import { RangeBandCalculator } from "../../combat/range-band-calculator";
import type { FoundryNotificationSink, FoundryLiveAttackSelection } from "../combat/foundry-live-attack-types";
import type { FoundryAttackContextSource } from "../combat/foundry-attack-context-data-source";
import type { FoundryTargetActorSource } from "../item/foundry-weapon-attack-selection-source";
import type {
  SameHexFirearmCategory,
  SameHexFirearmModifierSource,
} from "../../rules/providers/same-hex-firearm-modifier-provider";
import type { RangedWeaponCategory } from "../../rules/ranged-combat-modifier-types";
import { T2K4EWeaponAdapter } from "../t2k4e/t2k4e-weapon-adapter";
import type { T2K4EItemLike } from "../t2k4e/t2k4e-types";
import type { CombatActionPermission } from "../chat/combat-action-permission";

type UnknownRecord = Record<string, unknown>;

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

function readActorId(token: unknown): string | undefined {
  const actorId = readPath(token, ["actor", "id"])
    ?? readPath(token, ["document", "actorId"])
    ?? readPath(token, ["actorId"]);

  return typeof actorId === "string" ? actorId : undefined;
}

function readCenter(token: unknown): { x: number; y: number } | null {
  const center = asRecord(readPath(token, ["center"]));
  if (
    center &&
    typeof center.x === "number" &&
    typeof center.y === "number"
  ) {
    return { x: center.x, y: center.y };
  }

  const record = asRecord(token);
  if (!record) {
    return null;
  }

  const x = record.x;
  const y = record.y;
  const width = record.w ?? record.width;
  const height = record.h ?? record.height;

  if (
    typeof x === "number" &&
    typeof y === "number" &&
    typeof width === "number" &&
    typeof height === "number"
  ) {
    return {
      x: x + width / 2,
      y: y + height / 2,
    };
  }

  return null;
}

function findTokenByActorId(canvas: unknown, actorId: string): unknown | null {
  const placeables = readPath(canvas, ["tokens", "placeables"]);

  if (!Array.isArray(placeables)) {
    return null;
  }

  return placeables.find(
    (token) => readActorId(token) === actorId,
  ) ?? null;
}

export class FoundryCanvasTargetActorSource implements FoundryTargetActorSource {
  constructor(
    private readonly getGame: () => unknown,
  ) {}

  getTargetActor(): unknown | null {
    const targets = readPath(this.getGame(), ["user", "targets"]);

    if (
      !targets ||
      typeof targets !== "object" ||
      !(Symbol.iterator in targets)
    ) {
      return null;
    }

    const targetList = Array.from(
      targets as Iterable<unknown>,
    );

    if (targetList.length !== 1) {
      return null;
    }

    return readPath(targetList[0], ["actor"])
      ?? readPath(targetList[0], ["document", "actor"])
      ?? null;
  }
}

export class FoundryUiNotificationSink implements FoundryNotificationSink {
  constructor(
    private readonly getUi: () => unknown,
  ) {}

  warn(message: string): void {
    this.notify("warn", message);
  }

  error(message: string): void {
    this.notify("error", message);
  }

  private notify(kind: "warn" | "error", message: string): void {
    const notifications = asRecord(
      readPath(this.getUi(), ["notifications"]),
    );

    const handler = notifications?.[kind];

    if (typeof handler === "function") {
      handler.call(notifications, message);
      return;
    }

    if (kind === "error") {
      console.error(`[tw2k-tactical] ${message}`);
    } else {
      console.warn(`[tw2k-tactical] ${message}`);
    }
  }
}

export class FoundryWeaponCategoryResolver {
  resolve(weapon: unknown): RangedWeaponCategory {
    const candidates = [
      readPath(weapon, ["system", "weaponCategory"]),
      readPath(weapon, ["system", "category"]),
      readPath(weapon, ["system", "weaponType"]),
      readPath(weapon, ["system", "group"]),
      readPath(weapon, ["name"]),
    ]
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.toLowerCase());

    const text = candidates.join(" ");

    if (text.includes("assault") && text.includes("rifle")) return "assault-rifle";
    if (text.includes("gpmg") || text.includes("general purpose machine")) return "gpmg";
    if (text.includes("hmg") || text.includes("heavy machine")) return "hmg";
    if (text.includes("lmg") || text.includes("light machine")) return "lmg";
    if (text.includes("smg") || text.includes("submachine")) return "smg";
    if (text.includes("carbine")) return "carbine";
    if (text.includes("pistol") || text.includes("handgun") || text.includes("revolver")) return "pistol";
    if (text.includes("rifle")) return "rifle";

    return "other";
  }

  hasTelescopicSight(weapon: unknown): boolean {
    const booleanPaths = [
      ["system", "hasTelescopicSight"],
      ["system", "telescopicSight"],
      ["system", "scope"],
      ["system", "optics", "telescopic"],
    ] as const;

    if (
      booleanPaths.some((path) => readPath(weapon, path) === true)
    ) {
      return true;
    }

    const name = readPath(weapon, ["name"]);
    return typeof name === "string" && /scope|telescopic/i.test(name);
  }
}

export class FoundrySelectionAttackContextSource
  implements FoundryAttackContextSource, SameHexFirearmModifierSource
{
  private readonly weaponProfile;

  constructor(
    private readonly selection: FoundryLiveAttackSelection,
    private readonly getCanvas: () => unknown,
    private readonly categoryResolver: FoundryWeaponCategoryResolver,
  ) {
    this.weaponProfile = new T2K4EWeaponAdapter(
      selection.weapon as T2K4EItemLike,
    ).toProfile();
  }

  getTokenDistanceHexes(attackerId: string, targetId: string): number {
    const canvas = this.getCanvas();
    const attacker = findTokenByActorId(canvas, attackerId);
    const target = findTokenByActorId(canvas, targetId);

    if (!attacker || !target) {
      throw new Error("Unable to locate attacker and target tokens on the active canvas.");
    }

    const attackerCenter = readCenter(attacker);
    const targetCenter = readCenter(target);

    if (!attackerCenter || !targetCenter) {
      throw new Error("Unable to determine attacker and target token centers.");
    }

    const pixelDistance = Math.hypot(
      targetCenter.x - attackerCenter.x,
      targetCenter.y - attackerCenter.y,
    );

    if (pixelDistance === 0) {
      return 0;
    }

    const grid = asRecord(readPath(canvas, ["grid"]));
    const measurePath = grid?.measurePath;
    const sceneGridDistance = readPath(canvas, ["scene", "grid", "distance"]);

    if (
      typeof measurePath === "function" &&
      typeof sceneGridDistance === "number" &&
      sceneGridDistance > 0
    ) {
      try {
        const measured = measurePath.call(
          grid,
          [attackerCenter, targetCenter],
        );
        const distance = readPath(measured, ["distance"]);

        if (typeof distance === "number" && Number.isFinite(distance)) {
          return Math.max(0, Math.round(distance / sceneGridDistance));
        }
      } catch {
        // Fall through to pixel/grid-size measurement.
      }
    }

    const gridSize = grid?.size;

    if (typeof gridSize === "number" && gridSize > 0) {
      return Math.max(0, Math.round(pixelDistance / gridSize));
    }

    throw new Error("Unable to measure token distance on the active canvas.");
  }

  getWeaponRangeBand(weaponId: string, distanceHexes: number): RangeBand {
    if (weaponId !== this.weaponProfile.weaponId) {
      throw new Error(`Unexpected weapon ID: ${weaponId}`);
    }

    return new RangeBandCalculator().calculate(
      distanceHexes,
      {
        shortRangeHexes: this.weaponProfile.shortRangeHexes,
      },
    );
  }

  isCloseCombatAttack(_request: AttackRequest): boolean {
    return false;
  }

  getWeaponCategory(_weaponId: string): SameHexFirearmCategory {
    const category = this.categoryResolver.resolve(this.selection.weapon);

    return category === "pistol" ||
      category === "carbine" ||
      category === "smg"
      ? category
      : "other";
  }

  isTargetActiveAndAware(_targetId: string): boolean {
    return true;
  }

  isAtShortRange(): boolean {
    const attackerId = readPath(this.selection.attackerActor, ["id"]);
    const targetId = readPath(this.selection.targetActor, ["id"]);

    if (typeof attackerId !== "string" || typeof targetId !== "string") {
      return false;
    }

    return this.getTokenDistanceHexes(attackerId, targetId)
      <= this.weaponProfile.shortRangeHexes;
  }

  isSameHex(): boolean {
    const attackerId = readPath(this.selection.attackerActor, ["id"]);
    const targetId = readPath(this.selection.targetActor, ["id"]);

    if (typeof attackerId !== "string" || typeof targetId !== "string") {
      return false;
    }

    return this.getTokenDistanceHexes(attackerId, targetId) === 0;
  }
}

export class FoundryOwnerOrGmCombatActionPermission implements CombatActionPermission {
  constructor(
    private readonly getGame: () => unknown,
  ) {}

  canApplyResult(targetActorId: string): boolean {
    const game = this.getGame();
    const user = readPath(game, ["user"]);

    if (readPath(user, ["isGM"]) === true) {
      return true;
    }

    const actors = asRecord(readPath(game, ["actors"]));
    const getActor = actors?.get;

    if (typeof getActor !== "function") {
      return false;
    }

    const actor = getActor.call(actors, targetActorId);

    if (readPath(actor, ["isOwner"]) === true) {
      return true;
    }

    const testUserPermission = asRecord(actor)?.testUserPermission;

    if (typeof testUserPermission === "function") {
      return Boolean(
        testUserPermission.call(actor, user, "OWNER"),
      );
    }

    return false;
  }
}

export function readFoundryName(value: unknown, fallback: string): string {
  const name = readPath(value, ["name"]);
  return typeof name === "string" && name.length > 0 ? name : fallback;
}
