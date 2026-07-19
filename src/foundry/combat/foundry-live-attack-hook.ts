import type { FoundryLiveAttackController } from "./foundry-live-attack-controller";

export interface FoundryHookBus {
  on(
    hook: string,
    callback: (...args: unknown[]) => unknown,
  ): unknown;
}

export function registerFoundryLiveAttackHook(
  hooks: FoundryHookBus,
  controller: FoundryLiveAttackController,
  hookName = "tw2k-tactical.attack",
): void {
  hooks.on(hookName, async () => {
    await controller.attack();
  });
}
