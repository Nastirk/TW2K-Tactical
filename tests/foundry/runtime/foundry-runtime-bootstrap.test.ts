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
    expect(registered).toContain("createChatMessage");
    expect(registered).toContain("deleteChatMessage");

    const api = moduleRecord.api as {
      attack?: unknown;
      officialAttack?: unknown;
      reload?: unknown;
      diagnostics?: () => { systemId?: string };
      integrationCapabilities?: () => {
        officialT2K4E: { active: boolean };
      };
    };

    expect(typeof api.attack).toBe("function");
    expect(typeof api.officialAttack).toBe("function");
    expect(typeof api.reload).toBe("function");
    expect(api.diagnostics?.().systemId).toBe("t2k4e");
    expect(
      api.integrationCapabilities?.()
        .officialT2K4E.active,
    ).toBe(true);
    expect(runtime.diagnostics().ok).toBe(true);
  });
});
