import { describe, expect, it, vi } from "vitest";
import { bootstrapFoundryRuntime } from "../../../src/foundry/runtime/foundry-runtime-bootstrap";

describe("bootstrapFoundryRuntime", () => {
  it("registers live attack and both item-sheet hooks and exposes diagnostics", () => {
    const registered: string[] = [];

    class DialogStub {
      constructor(_config: unknown) {}
      render(): void {}
    }

    const moduleRecord: Record<string, unknown> = {};

    const runtime = bootstrapFoundryRuntime({
      hooks: {
        on: vi.fn((name: string) => {
          registered.push(name);
          return 1;
        }),
      },
      Dialog: DialogStub as never,
      ChatMessage: {
        create: vi.fn().mockResolvedValue(undefined),
      },
      getGame: () => ({
        system: {
          id: "t2k4e",
          version: "14.0.1",
        },
        version: "14",
        modules: {
          get: () => moduleRecord,
        },
        user: {
          targets: new Set(),
        },
      }),
      getCanvas: () => ({
        grid: {},
        tokens: { controlled: [] },
      }),
      getUi: () => undefined,
      getChatRoot: () => null,
    });

    expect(registered).toContain("tw2k-tactical.attack");
    expect(registered).toContain("renderItemSheet");
    expect(registered).toContain("renderItemSheetV2");

    const api = moduleRecord.api as {
      attack?: unknown;
      reload?: unknown;
      diagnostics?: () => { systemId?: string };
    };

    expect(typeof api.attack).toBe("function");
    expect(typeof api.reload).toBe("function");
    expect(api.diagnostics?.().systemId).toBe("t2k4e");
    expect(runtime.diagnostics().ok).toBe(true);
  });
});
