import type { FoundryLiveAttackController } from "../combat/foundry-live-attack-controller";
import { FoundryWeaponAttackSelectionSource } from "./foundry-weapon-attack-selection-source";

export class FoundryWeaponAttackAction {
  constructor(
    private readonly selectionSource: FoundryWeaponAttackSelectionSource,
    private readonly controller: FoundryLiveAttackController,
  ) {}

  async launch(attackerActor: unknown, weapon: unknown): Promise<boolean> {
    this.selectionSource.begin(attackerActor, weapon);

    try {
      return await this.controller.attack();
    } finally {
      this.selectionSource.clear();
    }
  }
}
