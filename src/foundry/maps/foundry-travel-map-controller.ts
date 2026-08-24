import {
  TravelHexLookup,
  type TravelHexDataset,
  type TravelMapGridCalibration,
  type TravelMapScenePoint,
} from "../../maps/travel-hex-lookup";

const MODULE_ID = "tw2k-tactical";
const TRAVEL_MAP_FLAG = "travel-map";
const POLAND_MAP_ID = "t2k4e-coreset-poland";
const POLAND_DATASET_PATH =
  "modules/tw2k-tactical/data/travel-maps/core-poland/hexes.extracted.json";
const POLAND_OVERRIDES_PATH =
  "modules/tw2k-tactical/data/travel-maps/core-poland/gm-overrides.json";

type UnknownRecord = Record<string, unknown>;

interface FoundryHookBusLike {
  on(hook: string, callback: (...args: unknown[]) => unknown): unknown;
}

interface FoundrySceneLike {
  getFlag(scope: string, key: string): unknown;
  setFlag(scope: string, key: string, value: unknown): Promise<unknown>;
}

interface FoundryCanvasLike {
  ready?: boolean;
  scene?: FoundrySceneLike | null;
  stage?: { on(event: string, callback: (event: unknown) => unknown): unknown } | null;
}

interface FoundryGameLike {
  user?: { isGM?: boolean };
  i18n?: { localize(key: string): string };
}

interface FoundryNotificationSink {
  info(message: string): void;
  warn(message: string): void;
}

interface TravelMapFlag {
  mapId: string;
  calibration: TravelMapGridCalibration;
}

interface PointerEventLike {
  global?: { x?: unknown; y?: unknown };
  clientX?: unknown;
  clientY?: unknown;
  getLocalPosition?(container: unknown): { x?: unknown; y?: unknown };
}

export interface FoundryTravelMapControllerEnvironment {
  getCanvas(): unknown;
  getGame(): unknown;
  getUi(): unknown;
  loadDataset?(): Promise<TravelHexDataset>;
}

type InteractionMode = "none" | "calibrate-b1" | "calibrate-bf1" | "calibrate-b65" | "calibrate-bf65" | "calibrate-ad33" | "select";

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? value as UnknownRecord : null;
}

function asCanvas(value: unknown): FoundryCanvasLike | null {
  return asRecord(value) as FoundryCanvasLike | null;
}

function asGame(value: unknown): FoundryGameLike | null {
  return asRecord(value) as FoundryGameLike | null;
}

function asNotifications(value: unknown): FoundryNotificationSink | null {
  const notifications = asRecord(value)?.notifications;
  if (!notifications || typeof notifications !== "object") {
    return null;
  }

  const candidate = notifications as FoundryNotificationSink;
  return typeof candidate.info === "function" && typeof candidate.warn === "function"
    ? candidate
    : null;
}

function isScenePoint(value: unknown): value is TravelMapScenePoint {
  const record = asRecord(value);
  return typeof record?.x === "number" && typeof record.y === "number";
}

function asTravelMapFlag(value: unknown): TravelMapFlag | null {
  const record = asRecord(value);
  const calibration = asRecord(record?.calibration);
  return typeof record?.mapId === "string" &&
    isScenePoint(calibration?.b1) &&
    isScenePoint(calibration?.bf1) && isScenePoint(calibration?.b65) &&
    isScenePoint(calibration?.bf65) && isScenePoint(calibration?.ad33)
    ? {
      mapId: record.mapId,
      calibration: {
        b1: calibration.b1,
        bf1: calibration.bf1, b65: calibration.b65,
        bf65: calibration.bf65, ad33: calibration.ad33,
      },
    }
    : null;
}

function formatSelection(
  hex: { printedGridReference: string; features: readonly string[]; label: string | null },
  terrain: string | null,
): string {
  const parts = [hex.printedGridReference];
  if (hex.label) {
    parts.push(hex.label);
  }

  parts.push(terrain ?? "mixed/unclear terrain");
  if (hex.features.length > 0) {
    parts.push(hex.features.join(", "));
  }

  return parts.join(" — ");
}

async function defaultPolandDatasetLoader(): Promise<TravelHexDataset> {
  const response = await fetch(POLAND_DATASET_PATH);
  if (!response.ok) {
    throw new Error(`Unable to load Poland Travel Map data (${response.status}).`);
  }

  const data: unknown = await response.json();
  const record = asRecord(data);
  if (record?.mapId !== POLAND_MAP_ID || !Array.isArray(record.hexes)) {
    throw new Error("Poland Travel Map data is not in the expected format.");
  }

  const dataset = record as unknown as TravelHexDataset;
  const overridesResponse = await fetch(POLAND_OVERRIDES_PATH);
  if (!overridesResponse.ok) return dataset;

  const overrides = asRecord(await overridesResponse.json());
  if (overrides?.mapId !== POLAND_MAP_ID || !Array.isArray(overrides.hexes)) return dataset;

  const byReference = new Map<string, UnknownRecord>();
  for (const entry of overrides.hexes) {
    const override = asRecord(entry);
    if (typeof override?.printedGridReference === "string") byReference.set(override.printedGridReference, override);
  }

  return {
    ...dataset,
    hexes: dataset.hexes.map((hex) => {
      const override = byReference.get(hex.printedGridReference);
      if (!override || !Array.isArray(override.features) || !(typeof override.terrain === "string" || override.terrain === null)) return hex;
      return { ...hex, terrain: override.terrain as typeof hex.terrain, features: override.features.filter((feature): feature is string => typeof feature === "string") };
    }),
  };
}

/**
 * GM-only controls for anchoring and selecting official Travel Map hexes from
 * three printed black-dot centres, independently of the Foundry grid.
 * Selection reports geography only; it does not start encounters or open a
 * tactical Scene.
 */
export class FoundryTravelMapController {
  private mode: InteractionMode = "none";
  private lookup: TravelHexLookup | undefined;
  private registeredStage: object | undefined;
  private calibrationB1: TravelMapScenePoint | undefined;
  private calibrationBf1: TravelMapScenePoint | undefined;
  private calibrationB65: TravelMapScenePoint | undefined;
  private calibrationBf65: TravelMapScenePoint | undefined;
  private hoverRequest = 0;
  private tooltip: HTMLDivElement | undefined;

  constructor(private readonly environment: FoundryTravelMapControllerEnvironment) {}

  register(hooks: FoundryHookBusLike): void {
    hooks.on("getSceneControlButtons", (controls) => this.addSceneControls(controls));
    hooks.on("canvasReady", () => this.registerCanvasPointerHandler());
  }

  beginCalibration(): void {
    if (!this.isGm()) {
      return;
    }

    if (!this.currentCanvas()?.scene) {
      this.warn(this.localize("TW2K_TACTICAL.TravelMap.OpenPoland", "Open the Poland Travel Map Scene before calibrating it."));
      return;
    }

    this.mode = "calibrate-b1";
    this.calibrationB1 = undefined;
    this.calibrationBf1 = undefined;
    this.calibrationB65 = undefined;
    this.calibrationBf65 = undefined;
    this.info(this.localize("TW2K_TACTICAL.TravelMap.CalibrationPrompt", "TW2K Tactical: click printed travel hex B1 to calibrate this Scene."));
  }

  beginSelection(): void {
    if (!this.isGm()) {
      return;
    }

    const flag = this.currentTravelMapFlag();
    if (!flag || flag.mapId !== POLAND_MAP_ID) {
      this.warn(this.localize("TW2K_TACTICAL.TravelMap.CalibrateFirst", "Calibrate this Poland Travel Map Scene first."));
      return;
    }

    this.mode = "select";
    this.info(this.localize("TW2K_TACTICAL.TravelMap.SelectionPrompt", "TW2K Tactical: click a travel hex to inspect its extracted geography."));
  }

  private addSceneControls(value: unknown): void {
    const controls = asRecord(value);
    const tokens = asRecord(controls?.tokens);
    const tools = asRecord(tokens?.tools);
    if (!tokens || !tools) {
      return;
    }

    tools["tw2k-travel-calibrate"] = {
      name: "tw2k-travel-calibrate",
      title: this.localize("TW2K_TACTICAL.TravelMap.Calibrate", "Calibrate Poland Travel Map"),
      icon: "fa-solid fa-crosshairs",
      order: Object.keys(tools).length,
      button: true,
      visible: this.isGm(),
      onChange: () => this.beginCalibration(),
    };
    tools["tw2k-travel-select"] = {
      name: "tw2k-travel-select",
      title: this.localize("TW2K_TACTICAL.TravelMap.Inspect", "Inspect Poland Travel Hex"),
      icon: "fa-solid fa-map-location-dot",
      order: Object.keys(tools).length + 1,
      button: true,
      visible: this.isGm(),
      onChange: () => this.beginSelection(),
    };
  }

  private registerCanvasPointerHandler(): void {
    const stage = this.currentCanvas()?.stage;
    if (!stage || stage === this.registeredStage) {
      return;
    }

    stage.on("pointerdown", (event) => void this.handlePointer(event));
    stage.on("pointermove", (event) => void this.handleHover(event));
    stage.on("pointerout", () => this.hideTooltip());
    this.registeredStage = stage;
    this.hideTooltip();
  }

  private async handleHover(event: unknown): Promise<void> {
    const request = ++this.hoverRequest;
    const flag = this.currentTravelMapFlag();
    const scenePoint = this.getScenePoint(event);
    const clientPoint = this.getClientPoint(event);
    if (!flag || flag.mapId !== POLAND_MAP_ID || !scenePoint || !clientPoint) {
      this.hideTooltip();
      return;
    }

    try {
      const lookup = await this.getLookup();
      if (request !== this.hoverRequest) return;

      const hex = lookup.findAtScenePoint(scenePoint, flag.calibration);
      const terrain = lookup.resolveTerrain(hex);
      if (!hex || terrain.status === "not-found") {
        this.hideTooltip();
        return;
      }

      const terrainLabel = terrain.status === "known"
        ? terrain.terrain
        : this.localize("TW2K_TACTICAL.TravelMap.TerrainConfirmation", "terrain: GM confirmation required");
      this.showTooltip(formatSelection(hex, terrainLabel), clientPoint);
    } catch {
      if (request === this.hoverRequest) this.hideTooltip();
    }
  }

  private async handlePointer(event: unknown): Promise<void> {
    if (this.mode === "none" || !this.isGm()) {
      return;
    }
    if ((event as { button?: unknown }).button !== undefined && (event as { button?: unknown }).button !== 0) return;

    const scene = this.currentCanvas()?.scene;
    const scenePoint = this.getScenePoint(event);
    if (!scene || !scenePoint) {
      this.warn(this.localize("TW2K_TACTICAL.TravelMap.OffsetUnavailable", "Unable to determine the selected travel-grid hex."));
      return;
    }

    if (this.mode === "calibrate-b1") {
      this.calibrationB1 = scenePoint;
      this.mode = "calibrate-bf1";
      this.info("Now left-click printed travel hex Bf1 (top-right).");
      return;
    }
    if (this.mode === "calibrate-bf1") {
      this.calibrationBf1 = scenePoint;
      this.mode = "calibrate-bf65";
      this.info("Now left-click printed travel hex Bf65 (bottom-right).");
      return;
    }
    if (this.mode === "calibrate-b65") {
      this.calibrationB65 = scenePoint;
      this.mode = "calibrate-ad33";
      this.info("Finally, left-click printed travel hex Ad33 (centre).");
      return;
    }
    if (this.mode === "calibrate-bf65") {
      this.calibrationBf65 = scenePoint;
      this.mode = "calibrate-b65";
      this.info("Now left-click printed travel hex B65 (bottom-left).");
      return;
    }
    if (this.mode === "calibrate-ad33") {
      if (!this.calibrationB1 || !this.calibrationBf1 || !this.calibrationB65 || !this.calibrationBf65) return;

      await scene.setFlag(MODULE_ID, TRAVEL_MAP_FLAG, {
        mapId: POLAND_MAP_ID,
        calibration: {
          b1: this.calibrationB1,
          bf1: this.calibrationBf1, b65: this.calibrationB65,
          bf65: this.calibrationBf65, ad33: scenePoint,
        },
      } satisfies TravelMapFlag);
      this.mode = "none";
      this.info(this.localize("TW2K_TACTICAL.TravelMap.Calibrated", "Poland Travel Map calibrated. Use Inspect Poland Travel Hex to select a hex."));
      return;
    }

    this.mode = "none";
    const flag = this.currentTravelMapFlag();
    if (!flag || flag.mapId !== POLAND_MAP_ID) {
      this.warn(this.localize("TW2K_TACTICAL.TravelMap.CalibrateFirst", "Calibrate this Poland Travel Map Scene first."));
      return;
    }

    try {
      const lookup = await this.getLookup();
      const hex = lookup.findAtScenePoint(scenePoint, flag.calibration);
      const terrain = lookup.resolveTerrain(hex);

      if (!hex || terrain.status === "not-found") {
        this.warn(this.localize("TW2K_TACTICAL.TravelMap.OutsideDataset", "That Foundry grid hex is outside the extracted Poland Travel Map data."));
      } else if (terrain.status === "requires-gm-confirmation") {
        this.warn(`${formatSelection(hex, null)}. Confirm terrain manually before using travel automation.`);
      } else {
        this.info(formatSelection(hex, terrain.terrain));
      }
    } catch (error) {
      this.warn(error instanceof Error ? error.message : "Unable to inspect the selected travel hex.");
    }
  }

  private async getLookup(): Promise<TravelHexLookup> {
    if (!this.lookup) {
      const dataset = await (this.environment.loadDataset ?? defaultPolandDatasetLoader)();
      this.lookup = new TravelHexLookup(dataset);
    }

    return this.lookup;
  }

  private getScenePoint(event: unknown): TravelMapScenePoint | null {
    const pointer = event as PointerEventLike;
    const canvas = this.currentCanvas();
    const local = typeof pointer.getLocalPosition === "function" && canvas?.stage
      ? pointer.getLocalPosition(canvas.stage)
      : pointer.global;
    const x = local?.x;
    const y = local?.y;
    if (typeof x !== "number" || typeof y !== "number") {
      return null;
    }

    return { x, y };
  }

  private getClientPoint(event: unknown): TravelMapScenePoint | null {
    const pointer = event as PointerEventLike;
    const x = pointer.clientX ?? pointer.global?.x;
    const y = pointer.clientY ?? pointer.global?.y;
    return typeof x === "number" && typeof y === "number" ? { x, y } : null;
  }

  private showTooltip(message: string, point: TravelMapScenePoint): void {
    if (typeof document === "undefined") return;

    const tooltip = this.getTooltip();
    if (!tooltip) return;

    tooltip.textContent = message;
    tooltip.style.left = `${point.x + 14}px`;
    tooltip.style.top = `${point.y + 14}px`;
    tooltip.hidden = false;
  }

  private hideTooltip(): void {
    if (this.tooltip) this.tooltip.hidden = true;
  }

  private getTooltip(): HTMLDivElement | undefined {
    if (this.tooltip) return this.tooltip;

    const existing = document.getElementById("tw2k-tactical-travel-map-tooltip");
    if (existing?.tagName === "DIV") {
      this.tooltip = existing as HTMLDivElement;
      return this.tooltip;
    }

    const tooltip = document.createElement("div");
    tooltip.id = "tw2k-tactical-travel-map-tooltip";
    tooltip.setAttribute("role", "status");
    tooltip.style.position = "fixed";
    tooltip.style.zIndex = "100";
    tooltip.style.pointerEvents = "none";
    tooltip.style.maxWidth = "340px";
    tooltip.style.padding = "6px 8px";
    tooltip.style.border = "1px solid #8e7b50";
    tooltip.style.borderRadius = "3px";
    tooltip.style.background = "rgba(18, 16, 12, 0.94)";
    tooltip.style.color = "#f0e6cf";
    tooltip.style.fontSize = "13px";
    tooltip.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.45)";
    tooltip.hidden = true;
    document.body.append(tooltip);
    this.tooltip = tooltip;
    return tooltip;
  }

  private currentTravelMapFlag(): TravelMapFlag | null {
    return asTravelMapFlag(this.currentCanvas()?.scene?.getFlag(MODULE_ID, TRAVEL_MAP_FLAG));
  }

  private currentCanvas(): FoundryCanvasLike | null {
    return asCanvas(this.environment.getCanvas());
  }

  private isGm(): boolean {
    return asGame(this.environment.getGame())?.user?.isGM === true;
  }

  private localize(key: string, fallback: string): string {
    return asGame(this.environment.getGame())?.i18n?.localize(key) ?? fallback;
  }

  private info(message: string): void {
    asNotifications(this.environment.getUi())?.info(message);
  }

  private warn(message: string): void {
    asNotifications(this.environment.getUi())?.warn(message);
  }
}
