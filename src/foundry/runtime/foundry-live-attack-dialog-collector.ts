import type { ModifierAwareStagedRangedCombatRequest } from "../../combat/modifier-aware-staged-ranged-combat-workflow";
import type { HitLocation } from "../../combat/hit-location-resolver";
import type {
  FoundryAttackDialogCollector,
  FoundryAttackDialogInput,
  FoundryLiveAttackSelection,
} from "../combat/foundry-live-attack-types";
import { FoundryAttackDialogService } from "../dialog/foundry-attack-dialog-service";
import { T2K4ECombatRequestFactory } from "../t2k4e/t2k4e-combat-request-factory";
import { T2K4ERangedDiceSelector } from "../t2k4e/t2k4e-ranged-dice-selector";
import type { T2K4EActorLike, T2K4EItemLike } from "../t2k4e/t2k4e-types";
import { FoundryAttackDialogInitialFactory } from "./foundry-attack-dialog-initial-factory";
import type { FoundryAttackSelectionValidator } from "./foundry-t2k4e-compatibility";

export interface CollectedFoundryAttackDialogInput extends FoundryAttackDialogInput {
  attack: ModifierAwareStagedRangedCombatRequest;
}

export interface FoundryHitLocationResolver {
  resolve(): Promise<HitLocation>;
}

export class FoundryLiveAttackDialogCollector implements FoundryAttackDialogCollector {
  constructor(
    private readonly dialogService: FoundryAttackDialogService,
    private readonly combatRequestFactory: T2K4ECombatRequestFactory,
    private readonly initialFactory: FoundryAttackDialogInitialFactory,
    private readonly selectionValidator?: FoundryAttackSelectionValidator,
    private readonly hitLocationResolver?: FoundryHitLocationResolver,
  ) {}

  async collect(
    selection: FoundryLiveAttackSelection,
  ): Promise<CollectedFoundryAttackDialogInput | null> {
    this.selectionValidator?.assertAttackSelection(selection);

    // Resolve the normal random hit location before the T2K4E request
    // factory selects location-specific body armor. The core post-hit
    // workflow then receives this as chosenHitLocation and reuses it.
    const chosenHitLocation =
      await this.hitLocationResolver?.resolve();

    const combat = this.combatRequestFactory.createRangedAttack({
      attacker: selection.attackerActor as T2K4EActorLike,
      target: selection.targetActor as T2K4EActorLike,
      weapon: selection.weapon as T2K4EItemLike,
      chosenHitLocation,
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
          const category =
            attack.modifiers
              .weaponCategory;

          const isHeavyWeapon =
            category === "lmg" ||
            category === "gpmg" ||
            category === "hmg" ||
            category === "grenade-launcher" ||
            category === "missile-launcher" ||
            category === "mortar" ||
            category === "howitzer" ||
            category === "vehicle-cannon";

          const coverArmorLevel =
            this.resolveCoverArmorLevel(
              attack.modifiers,
              chosenHitLocation,
            );

          const dice = isHeavyWeapon
            ? new T2K4ERangedDiceSelector()
                .select(
                  selection.attackerActor as T2K4EActorLike,
                  attack.modifiers,
                )
            : {};

          finish({
            attack: {
              ...attack,
              combat: {
                ...attack.combat,
                ...dice,
                ...(coverArmorLevel !== undefined
                  ? { externalArmorLevel: coverArmorLevel }
                  : {}),
              },
            },
          });
        },
        onCancel: () => {
          finish(null);
        },
      });
    });
  }

  private resolveCoverArmorLevel(
    modifiers: ModifierAwareStagedRangedCombatRequest["modifiers"],
    hitLocation: HitLocation | undefined,
  ): number | undefined {
    if (
      !modifiers.coverEffectiveAgainstAttacker ||
      !hitLocation
    ) {
      return undefined;
    }

    const level = modifiers.targetCoverArmorLevel ?? 0;
    if (level <= 0) {
      return undefined;
    }

    if (modifiers.targetInFullCover) {
      return level;
    }

    if (
      modifiers.targetInPartialCover &&
      (hitLocation === "torso" || hitLocation === "legs")
    ) {
      return level;
    }

    return undefined;
  }
}
