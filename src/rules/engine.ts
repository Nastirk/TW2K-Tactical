import type { RuleContext } from "./context";
import type { RuleResult } from "./result";
import { ModifierRegistry } from "./registry";

export class RulesEngine {
  constructor(private readonly registry: ModifierRegistry) {}

  evaluate(context: RuleContext): RuleResult {
    return {
      modifiers: this.registry
        .getProviders()
        .flatMap((provider) => provider.getModifiers(context)),
    };
  }
}
