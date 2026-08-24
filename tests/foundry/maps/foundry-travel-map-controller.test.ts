import { describe, expect, it, vi } from "vitest";
import { FoundryTravelMapController } from "../../../src/foundry/maps/foundry-travel-map-controller";

describe("FoundryTravelMapController", () => {
  it("stores three printed black-dot centres on the Scene during calibration", async () => {
    const setFlag = vi.fn().mockResolvedValue(undefined);
    const stageOn = vi.fn();
    const hooksOn = vi.fn();
    const controller = new FoundryTravelMapController({
      getCanvas: () => ({
        scene: { getFlag: vi.fn(), setFlag },
        stage: { on: stageOn },
      }),
      getGame: () => ({ user: { isGM: true } }),
      getUi: () => ({ notifications: { info: vi.fn(), warn: vi.fn() } }),
    });

    controller.register({ on: hooksOn });
    const canvasReady = hooksOn.mock.calls.find(([hook]) => hook === "canvasReady")?.[1] as () => void;
    canvasReady();
    controller.beginCalibration();
    const pointerHandler = stageOn.mock.calls.find(([event]) => event === "pointerdown")?.[1] as (event: unknown) => Promise<void>;
    await pointerHandler({ global: { x: 100, y: 100 } });
    await pointerHandler({ global: { x: 200, y: 100 } });
    await pointerHandler({ global: { x: 50, y: 180 } });
    await pointerHandler({ global: { x: 50, y: 5140 } });

    expect(setFlag).toHaveBeenCalledWith("tw2k-tactical", "travel-map", {
      mapId: "t2k4e-coreset-poland",
      calibration: {
        b1: { x: 100, y: 100 },
        d1: { x: 200, y: 100 },
        a2: { x: 50, y: 180 },
        a64: { x: 50, y: 5140 },
      },
    });
  });

  it("requires calibration before a GM can inspect a travel hex", () => {
    const warn = vi.fn();
    const controller = new FoundryTravelMapController({
      getCanvas: () => ({ scene: { getFlag: () => undefined, setFlag: vi.fn() } }),
      getGame: () => ({ user: { isGM: true } }),
      getUi: () => ({ notifications: { info: vi.fn(), warn } }),
    });

    controller.beginSelection();

    expect(warn).toHaveBeenCalledWith("Calibrate this Poland Travel Map Scene first.");
  });

  it("uses a scene-local pointer position when Foundry has panned or zoomed the canvas", async () => {
    const setFlag = vi.fn().mockResolvedValue(undefined);
    const stageOn = vi.fn();
    const hooksOn = vi.fn();
    const controller = new FoundryTravelMapController({
      getCanvas: () => ({
        scene: { getFlag: vi.fn(), setFlag },
        stage: { on: stageOn },
      }),
      getGame: () => ({ user: { isGM: true } }),
      getUi: () => ({ notifications: { info: vi.fn(), warn: vi.fn() } }),
    });

    controller.register({ on: hooksOn });
    const canvasReady = hooksOn.mock.calls.find(([hook]) => hook === "canvasReady")?.[1] as () => void;
    canvasReady();
    controller.beginCalibration();
    const pointerHandler = stageOn.mock.calls.find(([event]) => event === "pointerdown")?.[1] as (event: unknown) => Promise<void>;
    await pointerHandler({ global: { x: 1000, y: 1000 }, getLocalPosition: () => ({ x: 100, y: 200 }) });
    await pointerHandler({ global: { x: 1001, y: 1000 }, getLocalPosition: () => ({ x: 200, y: 200 }) });
    await pointerHandler({ global: { x: 1002, y: 1000 }, getLocalPosition: () => ({ x: 50, y: 280 }) });
    await pointerHandler({ global: { x: 1003, y: 1000 }, getLocalPosition: () => ({ x: 50, y: 5240 }) });

    expect(setFlag).toHaveBeenCalledWith("tw2k-tactical", "travel-map", {
      mapId: "t2k4e-coreset-poland",
      calibration: {
        b1: { x: 100, y: 200 },
        d1: { x: 200, y: 200 },
        a2: { x: 50, y: 280 },
        a64: { x: 50, y: 5240 },
      },
    });
  });

  it("shows the extracted coordinate and geography to a player on hover", async () => {
    const originalDocument = globalThis.document;
    const tooltip = {
      id: "",
      tagName: "DIV",
      hidden: true,
      textContent: "",
      style: {},
      setAttribute: vi.fn(),
    } as unknown as HTMLDivElement;
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        getElementById: () => null,
        createElement: () => tooltip,
        body: { append: vi.fn() },
      },
    });

    try {
      const stageOn = vi.fn();
      const controller = new FoundryTravelMapController({
        getCanvas: () => ({
          scene: {
            getFlag: () => ({
              mapId: "t2k4e-coreset-poland",
              calibration: {
                b1: { x: 100, y: 100 },
                d1: { x: 200, y: 100 },
                a2: { x: 50, y: 180 },
                a64: { x: 50, y: 5140 },
              },
            }),
            setFlag: vi.fn(),
          },
          stage: { on: stageOn },
        }),
        getGame: () => ({ user: { isGM: false } }),
        getUi: () => ({ notifications: { info: vi.fn(), warn: vi.fn() } }),
        loadDataset: async () => ({
          mapId: "t2k4e-coreset-poland",
          hexes: [{
            id: "poland-r00-c00",
            coordinates: { row: 0, column: 0 },
            printedGridReference: "B1",
            terrain: "open",
            features: ["river", "settlement"],
            label: null,
          }],
        }),
      });

      const hooksOn = vi.fn();
      controller.register({ on: hooksOn });
      (hooksOn.mock.calls.find(([hook]) => hook === "canvasReady")?.[1] as () => void)();
      const hoverHandler = stageOn.mock.calls.find(([event]) => event === "pointermove")?.[1] as (event: unknown) => Promise<void>;
      await hoverHandler({ global: { x: 100, y: 100 }, clientX: 300, clientY: 400 });

      expect(tooltip.textContent).toBe("B1 — open — river, settlement");
      expect(tooltip.hidden).toBe(false);
    } finally {
      Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
    }
  });
});
