import { describe, expect, it } from "vitest";
import { FoundryT2K4ECompatibilityService } from "../../../src/foundry/runtime/foundry-t2k4e-compatibility";

describe("FoundryT2K4ECompatibilityService", () => {
  it("reports a compatible T2K4E Foundry environment", () => {
    const service = new FoundryT2K4ECompatibilityService(
      () => ({
        system: {
          id: "t2k4e",
          version: "14.0.1",
        },
        version: "14.0.0",
        user: {
          targets: new Set([{ actor: { id: "target" } }]),
        },
      }),
      () => ({
        grid: {},
        tokens: {
          controlled: [{ actor: { id: "attacker" } }],
        },
      }),
    );

    expect(service.inspect()).toMatchObject({
      ok: true,
      systemId: "t2k4e",
      systemVersion: "14.0.1",
      foundryVersion: "14.0.0",
      canvasReady: true,
      gridReady: true,
      targetCount: 1,
      controlledTokenCount: 1,
      issues: [],
    });
  });

  it("reports an incompatible active game system", () => {
    const service = new FoundryT2K4ECompatibilityService(
      () => ({
        system: { id: "dnd5e" },
        user: { targets: new Set() },
      }),
      () => ({ grid: {} }),
    );

    const report = service.inspect();

    expect(report.ok).toBe(false);
    expect(report.issues[0]).toContain("dnd5e");
  });

  it("rejects a non-weapon item before building a T2K4E attack request", () => {
    const service = new FoundryT2K4ECompatibilityService(
      () => ({ system: { id: "t2k4e" } }),
      () => ({ grid: {} }),
    );

    expect(() => service.assertAttackSelection({
      attackerActor: { id: "attacker" },
      targetActor: { id: "target" },
      weapon: {
        id: "item",
        type: "armor",
      },
    })).toThrow("expected a T2K4E weapon item");
  });
});
