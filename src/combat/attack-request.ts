import type {
  AttackContextOverrides,
} from "./attack-context";

export interface AttackRequest {
  attackerId: string;
  targetId: string;
  weaponId?: string;
  contextOverrides?: AttackContextOverrides;
}
