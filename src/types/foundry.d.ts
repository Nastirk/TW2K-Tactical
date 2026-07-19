declare interface FoundryHooks {
  once(
    hook: string,
    callback: (...args: unknown[]) => void | Promise<void>,
  ): number;

  on(
    hook: string,
    callback: (...args: unknown[]) => unknown,
  ): number;
}

declare const Hooks: FoundryHooks;

declare class Roll {
  constructor(formula: string);
  total: number | null;
  evaluate(options?: { async?: boolean }): Promise<Roll>;
}
