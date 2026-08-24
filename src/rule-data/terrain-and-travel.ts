import type {
  CombatTerrainDefinition,
  DeclarativeRule,
  TravelTerrainDefinition,
} from "./types";

const PLAYERS_57 = { manual: "players", page: 57, section: "Terrain & Hexes" } as const;
const PLAYERS_138 = { manual: "players", page: 138, section: "Travel Maps" } as const;

/** Rules-table values for the 10 metre tactical map. */
export const COMBAT_TERRAIN_DATA: readonly CombatTerrainDefinition[] = [
  { id: "pavement", source: PLAYERS_57, visibilityHexes: "unlimited", rangedAttackModifier: 0, movementModifier: 0, coverArmorLevel: null, infiltrationModifier: -2, blocksGroundMovement: false },
  { id: "field", source: PLAYERS_57, visibilityHexes: "unlimited", rangedAttackModifier: 0, movementModifier: 0, coverArmorLevel: null, infiltrationModifier: -1, blocksGroundMovement: false },
  { id: "shrubland", source: PLAYERS_57, visibilityHexes: "unlimited", rangedAttackModifier: -1, movementModifier: -1, coverArmorLevel: null, infiltrationModifier: 0, blocksGroundMovement: false },
  { id: "debris", source: PLAYERS_57, visibilityHexes: "unlimited", rangedAttackModifier: -1, movementModifier: -2, coverArmorLevel: 3, infiltrationModifier: 1, blocksGroundMovement: false },
  { id: "forest", source: PLAYERS_57, visibilityHexes: 3, rangedAttackModifier: -1, movementModifier: -1, coverArmorLevel: 2, infiltrationModifier: 1, blocksGroundMovement: false },
  { id: "foliage", source: PLAYERS_57, visibilityHexes: 1, rangedAttackModifier: -2, movementModifier: -3, coverArmorLevel: null, infiltrationModifier: 2, blocksGroundMovement: false },
  { id: "swamp", source: PLAYERS_57, visibilityHexes: "unlimited", rangedAttackModifier: 0, movementModifier: null, coverArmorLevel: null, infiltrationModifier: 1, blocksGroundMovement: false },
  { id: "shallows", source: PLAYERS_57, visibilityHexes: "unlimited", rangedAttackModifier: 0, movementModifier: null, coverArmorLevel: null, infiltrationModifier: 0, blocksGroundMovement: false },
  { id: "blocking", source: PLAYERS_57, visibilityHexes: "none", rangedAttackModifier: null, movementModifier: null, coverArmorLevel: null, infiltrationModifier: null, blocksGroundMovement: true },
  { id: "indoors", source: PLAYERS_57, visibilityHexes: "unlimited", rangedAttackModifier: -1, movementModifier: -2, coverArmorLevel: 1, infiltrationModifier: 1, blocksGroundMovement: false },
];

/** Rules-table values for the 10 kilometre travel map. */
export const TRAVEL_TERRAIN_DATA: readonly TravelTerrainDefinition[] = [
  { id: "road", source: PLAYERS_138, offRoadSpeedFactor: 1, drivingModifier: 3, foragingModifier: null, huntingModifier: null, scroungingModifier: 1, encounterDistanceDice: "2D10*2 minimum" },
  { id: "open", source: PLAYERS_138, offRoadSpeedFactor: 1, drivingModifier: 1, foragingModifier: -1, huntingModifier: 1, scroungingModifier: 0, encounterDistanceDice: "2D10*4" },
  { id: "woods", source: PLAYERS_138, offRoadSpeedFactor: 0.5, drivingModifier: -1, foragingModifier: 1, huntingModifier: 1, scroungingModifier: -1, encounterDistanceDice: "2D10" },
  { id: "hills", source: PLAYERS_138, offRoadSpeedFactor: 0.5, drivingModifier: 0, foragingModifier: 0, huntingModifier: 0, scroungingModifier: -1, encounterDistanceDice: "2D10*2" },
  { id: "mountains", source: PLAYERS_138, offRoadSpeedFactor: 1 / 3, drivingModifier: -1, foragingModifier: -2, huntingModifier: -1, scroungingModifier: -2, encounterDistanceDice: "2D10*3" },
  { id: "lake-river", source: PLAYERS_138, offRoadSpeedFactor: 1, drivingModifier: 2, foragingModifier: null, huntingModifier: 0, scroungingModifier: null, encounterDistanceDice: "2D10*4" },
  { id: "swamp", source: PLAYERS_138, offRoadSpeedFactor: 0.25, drivingModifier: -1, foragingModifier: -1, huntingModifier: 0, scroungingModifier: -2, encounterDistanceDice: "2D10*2" },
  { id: "ruins", source: PLAYERS_138, offRoadSpeedFactor: 0.5, drivingModifier: 0, foragingModifier: -2, huntingModifier: -1, scroungingModifier: 2, encounterDistanceDice: "2D10" },
];

export const TRAVEL_RULE_CATALOG: readonly DeclarativeRule[] = [
  { id: "combat.hex-scale", domain: "combat", source: { manual: "players", page: 54, section: "Battle Maps" }, when: [], effects: [{ operation: "set", target: "combat.hexMeters", value: 10 }], summary: "Tactical hexes are 10 metres across." },
  { id: "combat.turn.actions", domain: "combat", source: { manual: "players", page: 55, section: "Slow & Fast Actions" }, when: [], effects: [{ operation: "set", target: "turn.actionBudget", value: "one-slow-and-one-fast-or-two-fast" }], summary: "A turn permits one slow plus one fast action, or two fast actions." },
  { id: "combat.run", domain: "combat", source: { manual: "players", page: 58, section: "Foot Movement" }, when: [{ fact: "actor.stance", operator: "equals", value: "standing" }], effects: [{ operation: "set", target: "movement.baseHexes", value: 2 }, { operation: "roll", target: "movement.extraHexes", dice: "MOBILITY" }], summary: "Running is a fast action: move two hexes, plus one per Mobility success." },
  { id: "combat.crawl", domain: "combat", source: { manual: "players", page: 58, section: "Crawling" }, when: [{ fact: "actor.stance", operator: "equals", value: "prone" }], effects: [{ operation: "set", target: "movement.baseHexes", value: 1 }, { operation: "set", target: "movement.extraHexes.maximum", value: 1 }], summary: "Crawling replaces running for prone actors and is capped at two hexes." },
  { id: "combat.elevation-movement", domain: "combat", source: { manual: "players", page: 58, section: "Elevation" }, when: [{ fact: "movement.destinationHigher", operator: "equals", value: true }], effects: [{ operation: "set", target: "movement.destinationCostHexes", value: 2 }], summary: "Entering higher ground costs two hexes of movement." },
  { id: "combat.barbed-wire", domain: "combat", source: { manual: "players", page: 59, section: "Barbed Wire" }, when: [{ fact: "movement.barrier", operator: "equals", value: "concertina-wire" }], effects: [{ operation: "roll", target: "movement.crossBarrier", dice: "MOBILITY-2" }, { operation: "add", target: "actor.damage", value: 1 }], summary: "Crossing concertina wire is Mobility -2; failure inflicts damage and a legs critical injury." },
  { id: "travel.hex-scale", domain: "travel", source: PLAYERS_138, when: [], effects: [{ operation: "set", target: "travel.hexKilometres", value: 10 }], summary: "Travel hexes are 10 kilometres across." },
  { id: "travel.day-shifts", domain: "travel", source: PLAYERS_138, when: [], effects: [{ operation: "set", target: "travel.shiftsPerDay", value: 4 }], summary: "A travel day has morning, day, evening, and night shifts." },
  { id: "travel.march-base-speed", domain: "travel", source: { manual: "players", page: 139, section: "Marching" }, when: [], effects: [{ operation: "set", target: "travel.marchHexes", value: "road-or-open:2;off-road:1" }], summary: "A group normally marches two hexes on roads/open terrain and one hex off-road." },
  { id: "travel.forced-march", domain: "travel", source: { manual: "players", page: 140, section: "Forced March" }, when: [{ fact: "travel.marchShiftOfDay", operator: "equals", value: 3 }], effects: [{ operation: "roll", target: "travel.forcedMarch", dice: "STAMINA" }], summary: "A third marching shift requires Stamina; a fourth requires Stamina -2 and causes sleep deprivation." },
  { id: "travel.off-road-navigation", domain: "travel", source: { manual: "players", page: 140, section: "Navigation" }, when: [{ fact: "travel.offRoad", operator: "equals", value: true }], effects: [{ operation: "roll", target: "travel.navigation", dice: "SURVIVAL" }], summary: "Entering a new roadless hex off-road requires a Survival navigation roll." },
  { id: "travel.night-driving", domain: "travel", source: { manual: "players", page: 141, section: "Driving at Night" }, when: [{ fact: "travel.isNight", operator: "equals", value: true }], effects: [{ operation: "set", target: "travel.vehicleSpeedMultiplier", value: 0.5 }], summary: "Night driving halves vehicle travel speed, rounding fractions up." },
  { id: "travel.off-road-fuel", domain: "travel", source: { manual: "players", page: 141, section: "Fuel & Stills" }, when: [{ fact: "travel.offRoad", operator: "equals", value: true }], effects: [{ operation: "set", target: "vehicle.fuelConsumptionMultiplier", value: 2 }], summary: "Off-road driving doubles fuel consumption." },
  { id: "travel.foraging-season", domain: "travel", source: { manual: "players", page: 146, section: "Foraging" }, when: [], effects: [{ operation: "set", target: "travel.foragingSeasonModifier", value: "spring:-1,summer:0,autumn:1,winter:-2" }], summary: "Foraging gets seasonal modifiers of -1, 0, +1, and -2 from spring through winter." },
];
