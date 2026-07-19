import type { DieRoller } from "../../dice/roller";
import type { StepDie } from "../../dice/types";

export class FoundryDieRoller implements DieRoller {
  async rollDie(sides: StepDie): Promise<number> {
    const roll = await new Roll(`1d${sides}`).evaluate();
    return roll.total ?? 0;
  }
}
