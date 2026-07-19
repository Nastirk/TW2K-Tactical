import type { RuleContext } from "./context";
import type { Modifier } from "./modifier";

export interface ModifierProvider {
  getModifiers(context: RuleContext): Modifier[];
}
