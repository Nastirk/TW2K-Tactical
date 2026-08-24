import { describe, expect, it } from "vitest";
import {
  TravelHexLookup,
  type TravelHexDataset,
} from "../../src/maps/travel-hex-lookup";

const DATASET: TravelHexDataset = {
  mapId: "t2k4e-coreset-poland",
  hexes: [
    {
      id: "poland-r00-c00",
      coordinates: { row: 0, column: 0 },
      printedGridReference: "B1",
      terrain: "open",
      features: ["river", "settlement"],
      label: null,
    },
    {
      id: "poland-r00-c01",
      coordinates: { row: 0, column: 1 },
      printedGridReference: "D1",
      terrain: null,
      features: ["river"],
      label: null,
    },
    {
      id: "poland-r05-c03",
      coordinates: { row: 5, column: 3 },
      printedGridReference: "G6",
      terrain: "open",
      features: ["river", "road", "settlement"],
      label: null,
    },
  ],
};

describe("TravelHexLookup", () => {
  const lookup = new TravelHexLookup(DATASET);
  const calibration = {
    b1: { x: 100, y: 100 },
    bf1: { x: 184, y: 100 },
    b65: { x: 100, y: 420 },
    bf65: { x: 184, y: 420 },
    ad33: { x: 142, y: 260 },
  };

  it("translates scene positions using three known printed map-cell centres", () => {
    expect(lookup.findAtScenePoint({ x: 100, y: 100 }, calibration)?.id)
      .toBe("poland-r00-c00");
    expect(lookup.findAtScenePoint({ x: 200, y: 100 }, calibration)?.printedGridReference)
      .toBe("D1");
  });

  it("does not automate an extracted mixed-terrain hex", () => {
    const hex = lookup.findAtScenePoint({ x: 200, y: 100 }, calibration);

    expect(lookup.resolveTerrain(hex)).toEqual({ status: "requires-gm-confirmation" });
  });

  it("resets the horizontal offset on alternating rows", () => {
    // G6 is three columns right of the shifted A6 origin, not five columns
    // right of B1 after five cumulative row shifts.
    expect(lookup.findAtScenePoint({ x: 350, y: 500 }, calibration)?.printedGridReference)
      .toBe("G6");
  });


  it("reports scene cells outside the source dataset", () => {
    expect(lookup.resolveTerrain(lookup.findAtScenePoint({ x: 900, y: 900 }, calibration)))
      .toEqual({ status: "not-found" });
  });
});
