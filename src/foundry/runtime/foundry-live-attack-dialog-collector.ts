import type { ModifierAwareStagedRangedCombatRequest } from "../../combat/modifier-aware-staged-ranged-combat-workflow";
import type {
  FoundryAttackDialogCollector,
  FoundryAttackDialogInput,
  FoundryLiveAttackSelection,
} from "../combat/foundry-live-attack-types";
import { FoundryAttackDialogService } from "../dialog/foundry-attack-dialog-service";
import { T2K4ECombatRequestFactory } from "../t2k4e/t2k4e-combat-request-factory";
import type { T2K4EActorLike, T2K4EItemLike } from "../t2k4e/t2k4e-types";
import { FoundryAttackDialogInitialFactory } from "./foundry-attack-dialog-initial-factory";
import type { FoundryAttackSelectionValidator } from "./foundry-t2k4e-compatibility";

export interface CollectedFoundryAttackDialogInput extends FoundryAttackDialogInput {
  attack: ModifierAwareStagedRangedCombatRequest;
}

export class FoundryLiveAttackDialogCollector implements FoundryAttackDialogCollector {
  constructor(
    private readonly dialogService: FoundryAttackDialogService,
    private readonly combatRequestFactory: T2K4ECombatRequestFactory,
    private readonly initialFactory: FoundryAttackDialogInitialFactory,
    private readonly selectionValidator?: FoundryAttackSelectionValidator,
  ) {}

  async collect(
    selection: FoundryLiveAttackSelection,
  ): Promise<CollectedFoundryAttackDialogInput | null> {
    this.selectionValidator?.assertAttackSelection(selection);

    const combat = this.combatRequestFactory.createRangedAttack({
      attacker: selection.attackerActor as T2K4EActorLike,
      target: selection.targetActor as T2K4EActorLike,
      weapon: selection.weapon as T2K4EItemLike,
    });

    const initial = this.initialFactory.create(selection);

    return new Promise((resolve) => {
      let settled = false;

      const finish = (
        value: CollectedFoundryAttackDialogInput | null,
      ) => {
        if (settled) {
          return;
        }

        settled = true;
        resolve(value);
      };

      this.dialogService.open({
        combat,
        initial,
        onSubmit: (attack) => {
          finish({ attack });
        },
        onCancel: () => {
          finish(null);
        },
      });
    });
  }
}
