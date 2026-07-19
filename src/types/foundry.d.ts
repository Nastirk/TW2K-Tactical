declare interface FoundryHooks {
  once(
    hook: string,
    callback: (...args: unknown[]) => void | Promise<void>,
  ): number;
}

declare const Hooks: FoundryHooks;

declare class Roll {
  constructor(formula: string);

  total: number | null;

  evaluate(options?: {
    async?: boolean;
  }): Promise<Roll>;
}