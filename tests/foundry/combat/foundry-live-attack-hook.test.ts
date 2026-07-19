import { describe, expect, it, vi } from "vitest";
import { registerFoundryLiveAttackHook } from "../../../src/foundry/combat/foundry-live-attack-hook";

describe("registerFoundryLiveAttackHook", () => {
  it("registers and delegates the attack hook", async () => {
    let callback: (() => Promise<void>) | undefined;
    const hooks = {
      on: vi.fn((_hook: string, handler: (...args: unknown[]) => unknown) => {
        callback = handler as () => Promise<void>;
      }),
    };
    const attack = vi.fn().mockResolvedValue(true);

    registerFoundryLiveAttackHook(
      hooks,
      { attack } as never,
    );

    expect(hooks.on).toHaveBeenCalledWith(
      "tw2k-tactical.attack",
      expect.any(Function),
    );

    await callback?.();
    expect(attack).toHaveBeenCalledOnce();
  });
});
