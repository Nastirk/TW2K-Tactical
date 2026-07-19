import type {
  FoundryLiveAttackSelection,
  FoundryLiveAttackSelectionSource,
} from "../combat/foundry-live-attack-types";

export interface FoundryTargetActorSource {
  getTargetActor(): unknown | null;
}

interface PendingWeaponAttackSelection {
  attackerActor: unknown;
  weapon: unknown;
}

export class FoundryWeaponAttackSelectionSource implements FoundryLiveAttackSelectionSource {
  private pending: PendingWeaponAttackSelection | null = null;

  constructor(
    private readonly targetSource: FoundryTargetActorSource,
  ) {}

  begin(attackerActor: unknown, weapon: unknown): void {
    this.pending = { attackerActor, weapon };
  }

  clear(): void {
    this.pending = null;
  }

  getSelection(): FoundryLiveAttackSelection | null {
    if (!this.pending) {
      return null;
    }

    const targetActor = this.targetSource.getTargetActor();

    if (!targetActor) {
      return null;
    }

    return {
      attackerActor: this.pending.attackerActor,
      targetActor,
      weapon: this.pending.weapon,
    };
  }
}
