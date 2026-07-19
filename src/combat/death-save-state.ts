import type { CriticalTimeLimit } from "./critical-injury-table";

export type DeathSaveStatus =
  | "not-required"
  | "required"
  | "stabilized"
  | "dead";

export interface DeathSaveState {
  lethal: boolean;
  instantDeath: boolean;
  status: DeathSaveStatus;
  timeLimit: CriticalTimeLimit;
}
