import { describe, expect, it, vi } from "vitest";
import { bootstrapFoundryRuntime } from "../../../src/foundry/runtime/foundry-runtime-bootstrap";

describe("bootstrapFoundryRuntime", () => {
  it("registers the live attack and item-sheet hooks", () => {
    const registered: string[] = [];

    class DialogStub {
      constructor(_config: unknown) {}
      render(): void {}
    }

    const moduleRecord: Record<string, unknown> = {};

    bootstrapFoundryRuntime({
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
        modules: {
          get: () => moduleRecord,
        },
        user: {
          targets: new Set(),
        },
      }),
      getCanvas: () => undefined,
      getUi: () => undefined,
      getChatRoot: () => null,
    });

    expect(registered).toContain("tw2k-tactical.attack");
    expect(registered).toContain("renderItemSheet");
    expect(moduleRecord.api).toBeDefined();
  });
});
