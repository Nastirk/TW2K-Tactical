export interface FoundryLiveAttackSelection {
  attackerActor: unknown;
  targetActor: unknown;
  weapon: unknown;
}

export interface FoundryLiveAttackSelectionSource {
  getSelection(): FoundryLiveAttackSelection | null;
}

export interface FoundryAttackDialogInput {
  [key: string]: unknown;
}

export interface FoundryAttackDialogCollector {
  collect(input: FoundryLiveAttackSelection): Promise<FoundryAttackDialogInput | null>;
}

export interface FoundryLiveAttackExecutor {
  execute(request: {
    selection: FoundryLiveAttackSelection;
    dialogInput: FoundryAttackDialogInput;
  }): Promise<void>;
}

export interface FoundryNotificationSink {
  warn(message: string): void;
  error?(message: string): void;
}
