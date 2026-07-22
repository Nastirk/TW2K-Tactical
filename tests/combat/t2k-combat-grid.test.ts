import { describe, expect, it } from "vitest";
import {
  convertFoundryDistanceToT2KHexes,
  convertFoundryStepsToT2KHexes,
  getFoundrySpacesPerT2KHex,
} from "../../src/combat/t2k-combat-grid";

describe("T2K 10m combat-distance conversion", () => {
  it("treats four 2m Foundry steps as the same T2K 10m hex", () => {
    expect(convertFoundryStepsToT2KHexes(4, 2)).toBe(0);
  });

  it("treats five 2m Foundry steps as one T2K combat hex", () => {
    expect(convertFoundryStepsToT2KHexes(5, 2)).toBe(1);
  });

  it("keeps each complete 10m band as one additional T2K hex", () => {
    expect(convertFoundryStepsToT2KHexes(9, 2)).toBe(1);
    expect(convertFoundryStepsToT2KHexes(10, 2)).toBe(2);
    expect(convertFoundryStepsToT2KHexes(14, 2)).toBe(2);
    expect(convertFoundryStepsToT2KHexes(15, 2)).toBe(3);
  });

  it("preserves ordinary 10m-per-grid scenes", () => {
    expect(convertFoundryStepsToT2KHexes(0, 10)).toBe(0);
    expect(convertFoundryStepsToT2KHexes(1, 10)).toBe(1);
    expect(convertFoundryStepsToT2KHexes(2, 10)).toBe(2);
  });

  it("converts direct metre measurements at exact 10m boundaries", () => {
    expect(convertFoundryDistanceToT2KHexes(8)).toBe(0);
    expect(convertFoundryDistanceToT2KHexes(10)).toBe(1);
    expect(convertFoundryDistanceToT2KHexes(19.999)).toBe(1);
    expect(convertFoundryDistanceToT2KHexes(20)).toBe(2);
  });

  it("reports the number of Foundry spaces in one T2K hex", () => {
    expect(getFoundrySpacesPerT2KHex(2)).toBe(5);
    expect(getFoundrySpacesPerT2KHex(10)).toBe(1);
  });
});
