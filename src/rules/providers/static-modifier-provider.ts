import type {
  AttackContext,
} from "../../combat/attack-context";
import type {
  Modifier,
} from "../modifier";

export class StaticModifierProvider {
  constructor(
    private readonly modifiers:
      readonly Modifier[],
  ) {}

  getModifiers(
    _context: AttackContext,
  ): Modifier[] {
    return [
      ...this.modifiers,
    ];
  }
}
