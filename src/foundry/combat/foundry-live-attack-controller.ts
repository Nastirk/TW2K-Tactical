import type {
  FoundryAttackDialogCollector,
  FoundryLiveAttackExecutor,
  FoundryLiveAttackSelectionSource,
  FoundryNotificationSink,
} from "./foundry-live-attack-types";

export class FoundryLiveAttackController {
  constructor(
    private readonly selectionSource: FoundryLiveAttackSelectionSource,
    private readonly dialogCollector: FoundryAttackDialogCollector,
    private readonly executor: FoundryLiveAttackExecutor,
    private readonly notifications: FoundryNotificationSink,
  ) {}

  async attack(): Promise<boolean> {
    const selection = this.selectionSource.getSelection();

    if (!selection) {
      this.notifications.warn(
        "Select an attacker, a target, and a ranged weapon before attacking.",
      );
      return false;
    }

    const dialogInput = await this.dialogCollector.collect(selection);

    if (!dialogInput) {
      return false;
    }

    try {
      await this.executor.execute({
        selection,
        dialogInput,
      });
      return true;
    } catch (error) {
      this.notifications.error?.(
        error instanceof Error ? error.message : "TW2K Tactical attack failed.",
      );
      throw error;
    }
  }
}
