declare interface FoundryHooks {
  once(
    hook: string,
    callback: (...args: unknown[]) => void | Promise<void>,
  ): number;
}

declare const Hooks: FoundryHooks;