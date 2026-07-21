import type { AttackRequest } from "../../combat/attack-request";
import type { RangeBand, TargetSizeCategory } from "../../combat/attack-context";
import { parseTerrainType } from "../../combat/terrain";
import type { TerrainType } from "../../combat/terrain";
import { RangeBandCalculator } from "../../combat/range-band-calculator";
import type { FoundryNotificationSink, FoundryLiveAttackSelection } from "../combat/foundry-live-attack-types";
import type { FoundryAttackContextSource } from "../combat/foundry-attack-context-data-source";
import type { FoundryTargetActorSource } from "../item/foundry-weapon-attack-selection-source";
import type {
  SameHexFirearmModifierSource,
} from "../../rules/providers/same-hex-firearm-modifier-provider";
import type { LightLevel, RangedWeaponCategory } from "../../rules/ranged-combat-modifier-types";
import { T2K4EWeaponAdapter } from "../t2k4e/t2k4e-weapon-adapter";
import type { T2K4EItemLike } from "../t2k4e/t2k4e-types";
import type { CombatActionPermission } from "../chat/combat-action-permission";
import {
  readAttachedWeaponId,
  readFoundryDocumentId,
} from "../item/foundry-weapon-accessory-attachment";
import {
  T2K_COMBAT_HEX_METERS,
  convertFoundryStepsToT2KHexes,
  getFoundrySpacesPerT2KHex,
} from "../../combat/t2k-combat-grid";
import type {
  T2KCombatGridEvidence,
  T2KGridMeasurementSource,
} from "../../combat/t2k-combat-grid";

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


function readSceneGridDistance(canvas: unknown): number {
  const candidates = [
    readPath(canvas, ["scene", "grid", "distance"]),
    readPath(canvas, ["grid", "distance"]),
  ];

  for (const value of candidates) {
    if (
      typeof value === "number" &&
      Number.isFinite(value) &&
      value > 0
    ) {
      return value;
    }
  }

  // Foundry Scenes normally provide the distance. Keeping a 10m default
  // preserves safe behavior for incomplete test doubles and integrations.
  return T2K_COMBAT_HEX_METERS;
}

interface GridCubeCoordinate {
  q: number;
  r: number;
  s: number;
}

function readGridCube(
  grid: unknown,
  point: { x: number; y: number },
): GridCubeCoordinate | null {
  const pointToCube = asRecord(grid)?.pointToCube;
  if (typeof pointToCube !== "function") {
    return null;
  }

  try {
    const cube = asRecord(
      pointToCube.call(grid, point),
    );
    const q = cube?.q;
    const r = cube?.r;
    const s = cube?.s;

    return typeof q === "number" && Number.isFinite(q) &&
      typeof r === "number" && Number.isFinite(r) &&
      typeof s === "number" && Number.isFinite(s)
      ? { q, r, s }
      : null;
  } catch {
    return null;
  }
}

function roundGridCube(
  cube: GridCubeCoordinate,
): GridCubeCoordinate {
  let q = Math.round(cube.q);
  let r = Math.round(cube.r);
  let s = Math.round(cube.s);

  const qDiff = Math.abs(q - cube.q);
  const rDiff = Math.abs(r - cube.r);
  const sDiff = Math.abs(s - cube.s);

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  } else {
    s = -q - r;
  }

  return { q, r, s };
}

function gridCubeDistance(
  a: GridCubeCoordinate,
  b: GridCubeCoordinate,
): number {
  return Math.max(
    Math.abs(a.q - b.q),
    Math.abs(a.r - b.r),
    Math.abs(a.s - b.s),
  );
}

interface T2KCombatGridMeasurement {
  distanceHexes: number;
  evidence: T2KCombatGridEvidence;
}

function createCombatGridMeasurement(
  foundryGridSteps: number,
  sceneGridDistance: number,
  measurementSource: T2KGridMeasurementSource,
): T2KCombatGridMeasurement {
  const normalizedSteps = Math.max(
    0,
    Math.round(foundryGridSteps),
  );
  const foundryDistanceMeters =
    normalizedSteps * sceneGridDistance;

  return {
    distanceHexes: convertFoundryStepsToT2KHexes(
      normalizedSteps,
      sceneGridDistance,
    ),
    evidence: {
      foundryMetersPerGridSpace: sceneGridDistance,
      foundryGridSteps: normalizedSteps,
      foundryDistanceMeters,
      t2kMetersPerCombatHex: T2K_COMBAT_HEX_METERS,
      foundrySpacesPerT2KHex:
        getFoundrySpacesPerT2KHex(sceneGridDistance),
      measurementSource,
    },
  };
}

function measureT2KCombatGrid(
  canvas: unknown,
  attackerCenter: { x: number; y: number },
  targetCenter: { x: number; y: number },
): T2KCombatGridMeasurement | null {
  const grid = asRecord(readPath(canvas, ["grid"]));
  const sceneGridDistance = readSceneGridDistance(canvas);

  if (!grid) {
    return null;
  }

  const attackerCube = readGridCube(grid, attackerCenter);
  const targetCube = readGridCube(grid, targetCenter);

  if (attackerCube && targetCube) {
    const attackerHex = roundGridCube(attackerCube);
    const targetHex = roundGridCube(targetCube);

    if (gridCubeDistance(attackerHex, targetHex) === 0) {
      return createCombatGridMeasurement(
        0,
        sceneGridDistance,
        "hex-coordinate-fallback",
      );
    }
  }

  // Foundry V14's measurePath result exposes both the number of grid spaces
  // traversed and the Scene-unit distance. The grid-space count is the most
  // useful value for a tactical sub-grid because the Scene distance setting
  // defines how many metres each Foundry hex represents.
  const measurePath = grid.measurePath;
  if (typeof measurePath === "function") {
    try {
      const measured = asRecord(
        measurePath.call(
          grid,
          [attackerCenter, targetCenter],
        ),
      );
      const spaces = measured?.spaces;
      const distance = measured?.distance;

      if (typeof spaces === "number" && Number.isFinite(spaces)) {
        return createCombatGridMeasurement(
          spaces,
          sceneGridDistance,
          "foundry-path",
        );
      }

      if (typeof distance === "number" && Number.isFinite(distance)) {
        return createCombatGridMeasurement(
          distance / sceneGridDistance,
          sceneGridDistance,
          "foundry-path",
        );
      }
    } catch {
      // Fall through to the hex-coordinate calculation.
    }
  }

  if (attackerCube && targetCube) {
    return createCombatGridMeasurement(
      gridCubeDistance(
        roundGridCube(attackerCube),
        roundGridCube(targetCube),
      ),
      sceneGridDistance,
      "hex-coordinate-fallback",
    );
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


function readTacticalFlag(
  value: unknown,
  key: string,
): unknown {
  const direct = readPath(
    value,
    ["flags", "tw2k-tactical", key],
  );

  if (direct !== undefined) {
    return direct;
  }

  const getFlag = asRecord(value)?.getFlag;
  return typeof getFlag === "function"
    ? getFlag.call(value, "tw2k-tactical", key)
    : undefined;
}

function readBooleanTacticalFlag(
  values: readonly unknown[],
  key: string,
): boolean | undefined {
  for (const value of values) {
    const flag = readTacticalFlag(value, key);
    if (typeof flag === "boolean") {
      return flag;
    }
  }
  return undefined;
}

function readIntegerTacticalFlag(
  values: readonly unknown[],
  key: string,
): number | undefined {
  for (const value of values) {
    const flag = readTacticalFlag(value, key);
    if (
      typeof flag === "number" &&
      Number.isInteger(flag)
    ) {
      return flag;
    }
  }
  return undefined;
}

function readLightLevelFlag(
  values: readonly unknown[],
): LightLevel | undefined {
  for (const value of values) {
    const flag = readTacticalFlag(value, "lightLevel");
    if (
      flag === "normal" ||
      flag === "dim" ||
      flag === "dark" ||
      flag === "total-darkness"
    ) {
      return flag;
    }
  }
  return undefined;
}

function actorHasEquippedGearMatching(
  actor: unknown,
  pattern: RegExp,
): boolean {
  return readCollectionValues(
    readPath(actor, ["items"]),
  ).some((item) => {
    const type = readPath(item, ["type"]);
    if (
      typeof type === "string" &&
      type.toLowerCase() !== "gear"
    ) {
      return false;
    }

    if (
      readPath(item, ["system", "equipped"]) !== true ||
      readPath(item, ["system", "backpack"]) === true
    ) {
      return false;
    }

    const text = [
      readPath(item, ["name"]),
      readPath(item, ["system", "itemType"]),
    ]
      .filter((candidate): candidate is string => typeof candidate === "string")
      .join(" ")
      .toLowerCase();

    return pattern.test(text);
  });
}

function actorHasSpecialty(
  actor: unknown,
  specialtyName: string,
): boolean {
  const normalized = specialtyName.trim().toLowerCase();
  return readCollectionValues(
    readPath(actor, ["items"]),
  ).some((item) => {
    const type = readPath(item, ["type"]);
    const name = readPath(item, ["name"]);
    return (
      typeof type === "string" &&
      type.toLowerCase() === "specialty" &&
      typeof name === "string" &&
      name.trim().toLowerCase() === normalized
    );
  });
}

function readActorHealthValue(actor: unknown): number | undefined {
  const value = readPath(actor, ["system", "health", "value"]);
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function testSightCollision(
  attackerToken: unknown,
  targetToken: unknown,
): boolean {
  const origin = readCenter(attackerToken);
  const destination = readCenter(targetToken);
  if (!origin || !destination) {
    return false;
  }

  const config = asRecord(
    (globalThis as unknown as { CONFIG?: unknown }).CONFIG,
  );
  const backend = readPath(
    config,
    ["Canvas", "polygonBackends", "sight"],
  );
  const testCollision = asRecord(backend)?.testCollision;

  if (typeof testCollision !== "function") {
    return false;
  }

  try {
    const result = testCollision.call(
      backend,
      origin,
      destination,
      { type: "sight", mode: "any" },
    );
    return result === true ||
      (Array.isArray(result) && result.length > 0);
  } catch {
    return false;
  }
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

type WeaponAccessoryKind = "scope" | "bipod" | "tripod" | "nightVision" | "suppressor" | "bayonet";

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
    if (text.includes("sniper") && text.includes("rifle")) return "sniper-rifle";
    if (text.includes("hunting") && text.includes("rifle")) return "hunting-rifle";
    if (text.includes("gpmg") || text.includes("general purpose machine")) return "gpmg";
    if (text.includes("hmg") || text.includes("heavy machine")) return "hmg";
    if (text.includes("lmg") || text.includes("light machine")) return "lmg";
    if (text.includes("smg") || text.includes("submachine")) return "smg";
    if (text.includes("shotgun")) return "shotgun";
    if (text.includes("carbine")) return "carbine";
    if (text.includes("pistol") || text.includes("handgun") || text.includes("revolver")) return "pistol";
    if (text.includes("grenade launcher")) return "grenade-launcher";
    if (text.includes("missile launcher") || text.includes("atrl") || text.includes("atgm")) return "missile-launcher";
    if (text.includes("mortar")) return "mortar";
    if (text.includes("howitzer")) return "howitzer";
    if (text.includes("vehicle cannon") || text.includes("autocannon") || text.includes("cannon")) return "vehicle-cannon";
    if (text.includes("crossbow")) return "crossbow";
    if (text.includes("bow")) return "bow";
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


  hasNightVisionSight(
    weapon: unknown,
    attackerActor?: unknown,
  ): boolean {
    return this.hasMountedAccessory(
      weapon,
      attackerActor,
      "nightVision",
    ) || readPath(
      weapon,
      ["system", "props", "nightVision"],
    ) === true;
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
      case "nightVision":
        return /night[ -]?vision|\bnvg\b/.test(description);
      case "suppressor":
        return /suppressor|silencer/.test(description);
      case "bayonet":
        return /bayonet/.test(description);
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
    const { distanceHexes } = this.getCombatGridMeasurement(
      attackerId,
      targetId,
    );
    return distanceHexes;
  }

  getCombatGridEvidence(
    attackerId: string,
    targetId: string,
  ): T2KCombatGridEvidence | undefined {
    return this.getCombatGridMeasurement(
      attackerId,
      targetId,
    ).evidence;
  }

  private getCombatGridMeasurement(
    attackerId: string,
    targetId: string,
  ): T2KCombatGridMeasurement {
    const canvas = this.getCanvas();
    const attacker = findTokenByActorId(canvas, attackerId);
    const target = findTokenByActorId(canvas, targetId);

    if (!attacker || !target) {
      throw new Error(
        "Unable to locate attacker and target tokens on the active canvas.",
      );
    }

    const attackerCenter = readCenter(attacker);
    const targetCenter = readCenter(target);

    if (!attackerCenter || !targetCenter) {
      throw new Error(
        "Unable to determine attacker and target token centers.",
      );
    }

    const measured = measureT2KCombatGrid(
      canvas,
      attackerCenter,
      targetCenter,
    );

    if (measured) {
      return measured;
    }

    const pixelDistance = Math.hypot(
      targetCenter.x - attackerCenter.x,
      targetCenter.y - attackerCenter.y,
    );
    const gridSize = readPath(canvas, ["grid", "size"]);
    const sceneGridDistance = readSceneGridDistance(canvas);

    if (
      typeof gridSize === "number" &&
      Number.isFinite(gridSize) &&
      gridSize > 0
    ) {
      return createCombatGridMeasurement(
        pixelDistance / gridSize,
        sceneGridDistance,
        "pixel-fallback",
      );
    }

    throw new Error(
      "Unable to measure token distance on the active canvas.",
    );
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


  isTargetDefenseless(targetId: string): boolean {
    const actor = this.getActorForId(targetId, this.selection.targetActor);
    const explicit = this.readFlagForActorOrToken(targetId, "defenseless");
    if (explicit !== undefined) {
      return explicit === true;
    }

    const health = readActorHealthValue(actor);
    return health === 0 ||
      hasActorStatus(actor, "dead") ||
      hasActorStatus(actor, "sleep") ||
      hasActorStatus(actor, "stun");
  }

  isTargetInFullCover(targetId: string): boolean {
    const actor = this.getActorForId(targetId, this.selection.targetActor);
    return hasActorStatus(actor, "fullCover");
  }

  isTargetInPartialCover(targetId: string): boolean {
    const actor = this.getActorForId(targetId, this.selection.targetActor);
    return hasActorStatus(actor, "partialCover");
  }

  isCoverEffectiveAgainstAttacker(
    attackerId: string,
    targetId: string,
  ): boolean {
    const explicit = this.readFlagForActorOrToken(
      targetId,
      "coverEffectiveAgainstAttacker",
    );

    if (explicit !== undefined) {
      return explicit === true;
    }

    // Terrain/barrier cover is directional. Without an explicit tactical
    // flag we do not silently guess that the attack is coming from the
    // protected 120-degree arc. Same-hex cover is also ineffective by
    // default unless the flag is set for an intervening barrier.
    void attackerId;
    return false;
  }

  getTargetCoverArmorLevel(targetId: string): number | undefined {
    const targetToken = findTokenByActorId(this.getCanvas(), targetId);
    const sources = [
      readPath(targetToken, ["document"]),
      targetToken,
      this.getActorForId(targetId, this.selection.targetActor),
    ];
    const value = readIntegerTacticalFlag(sources, "coverArmorLevel");
    return value !== undefined && value >= 0
      ? value
      : undefined;
  }

  didTargetMove(targetId: string): boolean {
    return this.readFlagForActorOrToken(
      targetId,
      "movedSincePreviousTurn",
    ) === true;
  }

  isFiringFromMovingVehicle(attackerId: string): boolean {
    return this.readFlagForActorOrToken(
      attackerId,
      "firingFromMovingVehicle",
    ) === true;
  }

  getLightLevel(
    _attackerId: string,
    targetId: string,
  ): LightLevel {
    const canvas = this.getCanvas();
    const targetToken = findTokenByActorId(canvas, targetId);
    const regions = targetToken
      ? readTokenRegions(targetToken, canvas)
      : [];
    return readLightLevelFlag([
      ...regions,
      readPath(targetToken, ["document"]),
      targetToken,
      readPath(canvas, ["scene"]),
    ]) ?? "normal";
  }

  getWeatherModifier(): number {
    const value = readIntegerTacticalFlag(
      [readPath(this.getCanvas(), ["scene"])],
      "weatherModifier",
    );
    return value !== undefined && value <= 0
      ? value
      : 0;
  }

  hasDenseSmoke(
    attackerId: string,
    targetId: string,
  ): boolean {
    const attackerActor = this.getActorForId(attackerId, this.selection.attackerActor);
    const targetActor = this.getActorForId(targetId, this.selection.targetActor);
    return hasActorStatus(attackerActor, "smoke") ||
      hasActorStatus(targetActor, "smoke") ||
      this.readFlagForActorOrToken(targetId, "denseSmoke") === true;
  }

  hasNightVision(
    attackerId: string,
    distanceHexes: number,
  ): boolean {
    const actor = this.getActorForId(attackerId, this.selection.attackerActor);
    const hasGear = actorHasEquippedGearMatching(
      actor,
      /night[ -]?vision|\bnvg\b/,
    ) || this.categoryResolver.hasNightVisionSight(
      this.selection.weapon,
      actor,
    );

    if (!hasGear) {
      return false;
    }

    const explicitRange = readIntegerTacticalFlag(
      [actor],
      "nightVisionRangeHexes",
    );
    const range = explicitRange !== undefined && explicitRange > 0
      ? explicitRange
      : 3;
    return distanceHexes <= range;
  }

  hasThermalOptics(attackerId: string): boolean {
    const actor = this.getActorForId(attackerId, this.selection.attackerActor);
    return actorHasEquippedGearMatching(
      actor,
      /thermal optic|thermal sight|thermals/,
    ) || readTacticalFlag(actor, "thermalOptics") === true;
  }

  getVisibilityLimitHexes(): number | undefined {
    const value = readIntegerTacticalFlag(
      [readPath(this.getCanvas(), ["scene"])],
      "visibilityLimitHexes",
    );
    return value !== undefined && value > 0
      ? value
      : undefined;
  }

  isLineOfSightBlocked(
    attackerId: string,
    targetId: string,
  ): boolean {
    const explicit = this.readFlagForActorOrToken(
      targetId,
      "lineOfSightBlocked",
    );
    if (explicit !== undefined) {
      return explicit === true;
    }

    const targetActor = this.getActorForId(targetId, this.selection.targetActor);
    if (
      hasActorStatus(targetActor, "fullCover") &&
      this.isCoverEffectiveAgainstAttacker(attackerId, targetId)
    ) {
      // Full cover has its own core exception: a known approximate target
      // location may still be attacked at -3. Let the cover resolver own
      // that rule instead of treating the sight collision as a hard block.
      return false;
    }

    const canvas = this.getCanvas();
    const attackerToken = findTokenByActorId(canvas, attackerId);
    const targetToken = findTokenByActorId(canvas, targetId);
    return Boolean(
      attackerToken &&
      targetToken &&
      testSightCollision(attackerToken, targetToken)
    );
  }

  getLineOfSightBlockReason(
    _attackerId: string,
    targetId: string,
  ): string | undefined {
    const targetToken = findTokenByActorId(this.getCanvas(), targetId);
    const reason = readTacticalFlag(
      readPath(targetToken, ["document"]) ?? targetToken,
      "lineOfSightBlockReason",
    );
    return typeof reason === "string" && reason.length > 0
      ? reason
      : undefined;
  }

  getHelperCount(attackerId: string): number {
    const value = this.readIntegerFlagForActorOrToken(
      attackerId,
      "helperCount",
    );
    return value === undefined
      ? 0
      : Math.max(0, Math.min(3, value));
  }

  hasAttackerSpecialty(
    attackerId: string,
    specialtyName: string,
  ): boolean {
    return actorHasSpecialty(
      this.getActorForId(attackerId, this.selection.attackerActor),
      specialtyName,
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

  getWeaponCategory(_weaponId: string): RangedWeaponCategory {
    return this.categoryResolver.resolve(this.selection.weapon);
  }

  isTargetActiveAndAware(targetId: string): boolean {
    return !this.isTargetDefenseless(targetId);
  }


  private getActorForId(
    actorId: string,
    preferredActor: unknown,
  ): unknown {
    if (readPath(preferredActor, ["id"]) === actorId) {
      return preferredActor;
    }
    const token = findTokenByActorId(this.getCanvas(), actorId);
    return readPath(token, ["actor"]) ??
      readPath(token, ["document", "actor"]);
  }

  private readFlagForActorOrToken(
    actorId: string,
    key: string,
  ): unknown {
    const canvas = this.getCanvas();
    const token = findTokenByActorId(canvas, actorId);
    const actor = this.getActorForId(
      actorId,
      readPath(this.selection.attackerActor, ["id"]) === actorId
        ? this.selection.attackerActor
        : this.selection.targetActor,
    );
    const values = [
      readPath(token, ["document"]),
      token,
      actor,
    ];
    const booleanValue = readBooleanTacticalFlag(values, key);
    return booleanValue !== undefined
      ? booleanValue
      : values.map((value) => readTacticalFlag(value, key))
          .find((value) => value !== undefined);
  }

  private readIntegerFlagForActorOrToken(
    actorId: string,
    key: string,
  ): number | undefined {
    const canvas = this.getCanvas();
    const token = findTokenByActorId(canvas, actorId);
    const actor = this.getActorForId(
      actorId,
      readPath(this.selection.attackerActor, ["id"]) === actorId
        ? this.selection.attackerActor
        : this.selection.targetActor,
    );
    return readIntegerTacticalFlag(
      [readPath(token, ["document"]), token, actor],
      key,
    );
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
