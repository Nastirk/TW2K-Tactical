import type { AttackRequest } from "../../combat/attack-request";
import type { RangeBand, TargetSizeCategory } from "../../combat/attack-context";
import { parseTerrainType } from "../../combat/terrain";
import type { TerrainType } from "../../combat/terrain";
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
import {
  readAttachedWeaponId,
  readFoundryDocumentId,
} from "../item/foundry-weapon-accessory-attachment";

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

function readTokenElevation(token: unknown): number {
  const candidates = [
    readPath(token, ["document", "elevation"]),
    readPath(token, ["elevation"]),
  ];

  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return 0;
}

function readTokenGridDimensions(
  token: unknown,
  canvas: unknown,
): { width: number; height: number } | null {
  const documentWidth = readPath(token, ["document", "width"]);
  const documentHeight = readPath(token, ["document", "height"]);

  if (
    typeof documentWidth === "number" &&
    Number.isFinite(documentWidth) &&
    documentWidth > 0 &&
    typeof documentHeight === "number" &&
    Number.isFinite(documentHeight) &&
    documentHeight > 0
  ) {
    return {
      width: documentWidth,
      height: documentHeight,
    };
  }

  const pixelWidth = readPath(token, ["w"]);
  const pixelHeight = readPath(token, ["h"]);
  const gridSize = readPath(canvas, ["grid", "size"]);

  if (
    typeof pixelWidth === "number" &&
    Number.isFinite(pixelWidth) &&
    pixelWidth > 0 &&
    typeof pixelHeight === "number" &&
    Number.isFinite(pixelHeight) &&
    pixelHeight > 0 &&
    typeof gridSize === "number" &&
    Number.isFinite(gridSize) &&
    gridSize > 0
  ) {
    return {
      width: pixelWidth / gridSize,
      height: pixelHeight / gridSize,
    };
  }

  return null;
}

function readCollectionValues(
  value: unknown,
): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    Symbol.iterator in value
  ) {
    return Array.from(
      value as Iterable<unknown>,
    );
  }

  const contents = readPath(
    value,
    ["contents"],
  );

  return Array.isArray(contents)
    ? contents
    : [];
}

function readTerrainFlag(
  value: unknown,
): TerrainType | undefined {
  const direct = parseTerrainType(
    readPath(
      value,
      [
        "flags",
        "tw2k-tactical",
        "terrainType",
      ],
    ),
  );

  if (direct) {
    return direct;
  }

  const record = asRecord(value);
  const getFlag = record?.getFlag;

  if (typeof getFlag !== "function") {
    return undefined;
  }

  return parseTerrainType(
    getFlag.call(
      value,
      "tw2k-tactical",
      "terrainType",
    ),
  );
}

function readTokenRegions(
  token: unknown,
  canvas: unknown,
): unknown[] {
  const tokenDocument =
    readPath(token, ["document"]) ??
    token;

  const directRegions =
    readCollectionValues(
      readPath(
        tokenDocument,
        ["regions"],
      ),
    );

  if (directRegions.length > 0) {
    return directRegions;
  }

  const sceneRegions =
    readCollectionValues(
      readPath(
        canvas,
        ["scene", "regions"],
      ) ??
      readPath(
        canvas,
        ["regions"],
      ),
    );

  return sceneRegions.filter(
    (region) =>
      readCollectionValues(
        readPath(
          region,
          ["tokens"],
        ),
      ).some(
        (regionToken) =>
          regionToken ===
            tokenDocument ||
          readActorId(
            regionToken,
          ) ===
            readActorId(token),
      ),
  );
}

function hasActorStatus(
  actor: unknown,
  statusId: string,
): boolean {
  const statuses = readPath(actor, ["statuses"]);

  if (
    statuses &&
    typeof statuses === "object" &&
    Symbol.iterator in statuses
  ) {
    for (const status of statuses as Iterable<unknown>) {
      if (status === statusId) {
        return true;
      }
    }
  }

  const effects = readPath(actor, ["effects"]);

  if (
    !effects ||
    typeof effects !== "object" ||
    !(Symbol.iterator in effects)
  ) {
    return false;
  }

  for (const effect of effects as Iterable<unknown>) {
    const directStatusId = readPath(
      effect,
      ["flags", "core", "statusId"],
    );

    if (directStatusId === statusId) {
      return true;
    }

    const effectRecord = asRecord(effect);
    const getFlag = effectRecord?.getFlag;

    if (
      typeof getFlag === "function" &&
      getFlag.call(effect, "core", "statusId") === statusId
    ) {
      return true;
    }
  }

  return false;
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

type WeaponAccessoryKind = "scope" | "bipod" | "tripod";

export class FoundryWeaponCategoryResolver {
  resolve(weapon: unknown): RangedWeaponCategory {
    const candidates = [
      readPath(weapon, ["system", "itemType"]),
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
    if (text.includes("shotgun")) return "shotgun";
    if (text.includes("carbine")) return "carbine";
    if (text.includes("pistol") || text.includes("handgun") || text.includes("revolver")) return "pistol";
    if (text.includes("rifle")) return "rifle";

    return "other";
  }

  /**
   * TW2K Tactical attachment is the authoritative accessory link.
   * An accessory is active when matching gear is equipped, not stored
   * in the backpack, and attached to this exact weapon document.
   *
   * The native T2K4E weapon property is maintained as a UI mirror by
   * the attachment service, rather than being a second prerequisite.
   * This prevents a stale/manual checkbox from breaking an otherwise
   * valid attachment.
   */
  hasTelescopicSight(
    weapon: unknown,
    attackerActor?: unknown,
  ): boolean {
    return this.hasMountedAccessory(
      weapon,
      attackerActor,
      "scope",
    );
  }

  hasBipod(
    weapon: unknown,
    attackerActor?: unknown,
  ): boolean {
    return this.hasMountedAccessory(
      weapon,
      attackerActor,
      "bipod",
    );
  }

  hasTripod(
    weapon: unknown,
    attackerActor?: unknown,
  ): boolean {
    return this.hasMountedAccessory(
      weapon,
      attackerActor,
      "tripod",
    );
  }

  isVehicleMounted(
    weapon: unknown,
  ): boolean {
    return readPath(
      weapon,
      ["system", "props", "mounted"],
    ) === true;
  }

  private hasMountedAccessory(
    weapon: unknown,
    attackerActor: unknown,
    kind: WeaponAccessoryKind,
  ): boolean {
    const weaponId = readFoundryDocumentId(
      weapon,
    );

    if (!weaponId) {
      return false;
    }

    return this.getActorItems(
      attackerActor,
    ).some(
      (item) =>
        this.isEquippedAccessory(
          item,
          kind,
          weaponId,
        ),
    );
  }

  private getActorItems(
    actor: unknown,
  ): unknown[] {
    return readCollectionValues(
      readPath(actor, ["items"]),
    );
  }

  private isEquippedAccessory(
    item: unknown,
    kind: WeaponAccessoryKind,
    weaponId: string,
  ): boolean {
    const itemType =
      readPath(item, ["type"]);

    if (
      typeof itemType === "string" &&
      itemType.toLowerCase() !== "gear"
    ) {
      return false;
    }

    if (
      readPath(
        item,
        ["system", "equipped"],
      ) !== true ||
      readPath(
        item,
        ["system", "backpack"],
      ) === true
    ) {
      return false;
    }

    if (
      readAttachedWeaponId(item) !==
      weaponId
    ) {
      return false;
    }

    const description = [
      readPath(item, ["name"]),
      readPath(
        item,
        ["system", "itemType"],
      ),
    ]
      .filter(
        (value): value is string =>
          typeof value === "string",
      )
      .join(" ")
      .toLowerCase();

    switch (kind) {
      case "scope":
        return /\btelescopic\b|\bscope\b/.test(
          description,
        );
      case "bipod":
        return /\bbipod\b/.test(
          description,
        );
      case "tripod":
        return /\btripod\b/.test(
          description,
        );
    }
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

  isAttackerProne(attackerId: string): boolean {
    const selectedAttackerId = readPath(
      this.selection.attackerActor,
      ["id"],
    );

    if (
      selectedAttackerId === attackerId &&
      hasActorStatus(
        this.selection.attackerActor,
        "prone",
      )
    ) {
      return true;
    }

    const attackerToken = findTokenByActorId(
      this.getCanvas(),
      attackerId,
    );

    const attackerActor =
      readPath(attackerToken, ["actor"]) ??
      readPath(attackerToken, ["document", "actor"]);

    return hasActorStatus(
      attackerActor,
      "prone",
    );
  }

  isTargetProne(targetId: string): boolean {
    const selectedTargetId = readPath(
      this.selection.targetActor,
      ["id"],
    );

    if (
      selectedTargetId === targetId &&
      hasActorStatus(
        this.selection.targetActor,
        "prone",
      )
    ) {
      return true;
    }

    const targetToken = findTokenByActorId(
      this.getCanvas(),
      targetId,
    );

    const targetActor =
      readPath(targetToken, ["actor"]) ??
      readPath(targetToken, ["document", "actor"]);

    return hasActorStatus(
      targetActor,
      "prone",
    );
  }

  getTargetSize(
    targetId: string,
  ): TargetSizeCategory {
    const canvas = this.getCanvas();
    const targetToken = findTokenByActorId(
      canvas,
      targetId,
    );

    if (!targetToken) {
      return "normal";
    }

    const dimensions =
      readTokenGridDimensions(
        targetToken,
        canvas,
      );

    if (!dimensions) {
      return "normal";
    }

    if (
      dimensions.width < 1 &&
      dimensions.height < 1
    ) {
      return "small";
    }

    if (
      dimensions.width > 1 ||
      dimensions.height > 1
    ) {
      return "large";
    }

    return "normal";
  }

  isAttackerElevated(
    attackerId: string,
    targetId: string,
  ): boolean {
    const canvas = this.getCanvas();
    const attackerToken = findTokenByActorId(
      canvas,
      attackerId,
    );
    const targetToken = findTokenByActorId(
      canvas,
      targetId,
    );

    if (!attackerToken || !targetToken) {
      return false;
    }

    return readTokenElevation(
      attackerToken,
    ) > readTokenElevation(
      targetToken,
    );
  }

  getTargetTerrain(
    targetId: string,
  ): TerrainType | undefined {
    const canvas = this.getCanvas();
    const targetToken =
      findTokenByActorId(
        canvas,
        targetId,
      );

    if (!targetToken) {
      return undefined;
    }

    for (
      const region of
        readTokenRegions(
          targetToken,
          canvas,
        )
    ) {
      const terrain =
        readTerrainFlag(region);

      if (terrain) {
        return terrain;
      }
    }

    return (
      readTerrainFlag(
        readPath(
          targetToken,
          ["document"],
        ),
      ) ??
      readTerrainFlag(
        targetToken,
      )
    );
  }

  hasTelescopicSight(weaponId: string): boolean {
    if (weaponId !== this.weaponProfile.weaponId) {
      return false;
    }

    return this.categoryResolver
      .hasTelescopicSight(
        this.selection.weapon,
        this.selection.attackerActor,
      );
  }

  hasBipod(weaponId: string): boolean {
    if (weaponId !== this.weaponProfile.weaponId) {
      return false;
    }

    return this.categoryResolver
      .hasBipod(
        this.selection.weapon,
        this.selection.attackerActor,
      );
  }

  usesShotgunRangeRules(weaponId: string): boolean {
    if (weaponId !== this.weaponProfile.weaponId) {
      return false;
    }

    return this.categoryResolver.resolve(
      this.selection.weapon,
    ) === "shotgun";
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

export function readFoundryUuid(value: unknown): string | undefined {
  const uuid = readPath(value, ["uuid"]);
  return typeof uuid === "string" && uuid.length > 0
    ? uuid
    : undefined;
}
