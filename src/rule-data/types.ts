/**
 * Declarative rules are intentionally separate from services and Foundry
 * adapters.  A resolver can consume these objects without needing a PDF,
 * localized display text, or a particular UI.
 */
export type RuleManual = "players" | "referees";

export interface RuleSource {
  manual: RuleManual;
  /** Printed page number, not the zero-based PDF page index. */
  page: number;
  section: string;
}

export type RuleValue = string | number | boolean | null;

export interface RulePredicate {
  fact: string;
  operator: "equals" | "gte" | "lt" | "present" | "absent";
  value?: RuleValue;
}

export interface RuleEffect {
  operation:
    | "add"
    | "set"
    | "block"
    | "roll"
    | "schedule"
    | "remove";
  target: string;
  value?: RuleValue;
  /** Keeps dice expressions machine-readable instead of burying them in prose. */
  dice?: string;
  timing?: "immediate" | "round" | "stretch" | "shift" | "day" | "week";
}

export interface DeclarativeRule {
  id: string;
  domain: "dice" | "combat" | "condition" | "environment" | "travel" | "referee" | "character" | "base";
  source: RuleSource;
  when: readonly RulePredicate[];
  effects: readonly RuleEffect[];
  /** A stable, non-player-facing description for developer tooling. */
  summary: string;
}

export interface SourceSection {
  id: string;
  manual: RuleManual;
  title: string;
  startPage: number;
  endPage: number;
  classification: "mechanics" | "reference-data" | "setting" | "advice" | "scenario";
}

export interface CombatTerrainDefinition {
  id: string;
  source: RuleSource;
  visibilityHexes: number | "unlimited" | "none";
  rangedAttackModifier: number | null;
  movementModifier: number | null;
  coverArmorLevel: number | null;
  infiltrationModifier: number | null;
  blocksGroundMovement: boolean;
}

export interface TravelTerrainDefinition {
  id: string;
  source: RuleSource;
  offRoadSpeedFactor: number | null;
  drivingModifier: number | null;
  foragingModifier: number | null;
  huntingModifier: number | null;
  scroungingModifier: number | null;
  encounterDistanceDice: string;
}

export interface WeaponDefinition {
  id: string;
  name: string;
  source: RuleSource;
  category: string;
  ammunition: string | null;
  reliability: number;
  rateOfFire: number | null;
  damage: number | null;
  criticalThreshold: number | null;
  blastPower: "A" | "B" | "C" | "D" | null;
  shortRangeHexes: number | null;
  magazineCapacity: number | null;
  armorModifier: number;
  encumbrance: number;
  price: number | null;
  traits?: readonly string[];
}

export interface GearDefinition {
  id: string;
  name: string;
  source: RuleSource;
  category: "armor" | "weapon-accessory" | "communications" | "observation" | "protective" | "medical" | "tool" | "fuel" | "power" | "food" | "field";
  reliability: number | null;
  encumbrance: number | null;
  price: number | null;
  effects: readonly RuleEffect[];
  traits?: readonly string[];
}

export interface VehicleDefinition {
  id: string;
  name: string;
  source: RuleSource;
  category: string;
  reliability: number | null;
  combatSpeed: { onRoad: number; offRoad: number; drivetrain?: "wheeled" | "tracked" | "water" };
  travelSpeed: { onRoad: number; offRoad: number };
  armor: { front: number; side: number; rear: number };
  fuel: { type: "gasoline" | "diesel" | null; capacityLitres: number | null; litresPerHex: number | null };
  crew: number;
  passengerCapacity: number;
  cargoEncumbrance: number;
  mainWeapon: string | null;
  secondaryWeapons: readonly string[];
  price: number | null;
  traits?: readonly string[];
}

export interface CardTableEntry {
  card: string;
  values: readonly string[];
}

export interface BaseFacilityDefinition {
  id: string;
  name: string;
  source: RuleSource;
  prerequisites: readonly string[];
  constructionTime: string;
  requiredSkills: readonly string[];
  effects: readonly RuleEffect[];
}

/** Scenario sites are world-content records, not linear adventures. */
export interface ScenarioSiteDefinition {
  id: string;
  name: string;
  source: RuleSource;
  scale: { widthMetres: number; heightMetres: number };
  requiredSections: readonly ("overview" | "rumors" | "situation" | "arrival" | "countdown" | "locations" | "npcs" | "events")[];
  locationCountRange: readonly [number, number];
  npcCountRange: readonly [number, number];
  eventCountRange: readonly [number, number];
  tags: readonly string[];
}
