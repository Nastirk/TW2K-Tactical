import type {
  HitLocation,
} from "../combat/hit-location-resolver";
import type { ModifierProvenance } from "../rules/modifier";
import type {
  AmmoSuccessAllocation,
} from "../combat/ammo-resolver";

export interface CombatChatModifierView {
  source: string;
  value: number;
  description: string;
  provenance?: ModifierProvenance;
}

export interface CombatChatEvidenceView {
  label: string;
  value: string;
}

export interface CombatChatDieView {
  sides: number;
  value?: number;
}

export interface CombatChatCriticalView {
  injury: string;
  lethal: boolean;
  timeLimit:
    | "round"
    | "stretch"
    | "shift"
    | null;
  effects: string[];
  healTime: string | null;
  instantDeath: boolean;
}

export interface CombatChatAmmunitionView {
  rolls: number[];
  successes: number;
  allocation: AmmoSuccessAllocation;
  damageSuccesses: number;
  additionalHitSuccesses: number;
  roundsSpent: number;
  roundsRemaining: number;
  empty: boolean;
}

export interface CombatChatCardViewModel {
  title: string;
  attackerName: string;
  targetName: string;
  weaponName: string;

  modifiers:
    CombatChatModifierView[];

  evidence?:
    CombatChatEvidenceView[];

  netModifier: number;

  baseDice:
    CombatChatDieView[];

  finalDice:
    CombatChatDieView[];

  rolledDice:
    CombatChatDieView[];

  successes: number;
  hit: boolean;

  ammunition?:
    CombatChatAmmunitionView;

  hitLocation?: HitLocation;
  damageBeforeArmor?: number;
  modifiedArmorLevel?: number;
  finalDamage?: number;

  critical?: CombatChatCriticalView;

  deathSaveStatus?:
    | "not-required"
    | "required"
    | "stabilized"
    | "dead";

  deathSaveTimeLimit?:
    | "round"
    | "stretch"
    | "shift"
    | null;

  targetActorId?: string;
  canApplyResult: boolean;
}
