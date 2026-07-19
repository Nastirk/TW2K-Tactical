import type { HitLocation } from "./hit-location-resolver";

export type CriticalTimeLimit =
  | "round"
  | "stretch"
  | "shift"
  | null;

export interface CriticalInjuryEntry {
  roll: number;
  location: HitLocation;
  injury: string;
  lethal: boolean;
  timeLimit: CriticalTimeLimit;
  effects: string[];
  healTime: string | null;
  instantDeath?: boolean;
}

const HEAD: CriticalInjuryEntry[] = [
  { roll: 1, location: "head", injury: "Ear slashed", lethal: false, timeLimit: null, effects: ["RECON -1"], healTime: "D6 days" },
  { roll: 2, location: "head", injury: "Concussion", lethal: false, timeLimit: null, effects: ["CUF -1"], healTime: "D6 days" },
  { roll: 3, location: "head", injury: "Nose crushed", lethal: false, timeLimit: null, effects: ["RECON -1", "PERSUASION -1"], healTime: "2D6 days" },
  { roll: 4, location: "head", injury: "Shattered teeth", lethal: false, timeLimit: null, effects: ["PERSUASION -2"], healTime: "3D6 days" },
  { roll: 5, location: "head", injury: "Cracked skull", lethal: true, timeLimit: "shift", effects: ["CUF -2"], healTime: "2D6 days" },
  { roll: 6, location: "head", injury: "Gouged eye", lethal: true, timeLimit: "shift", effects: ["RANGED COMBAT -2", "RECON -2"], healTime: "Permanent" },
  { roll: 7, location: "head", injury: "Brain hemorrhage", lethal: true, timeLimit: "stretch", effects: ["All INT skills -2"], healTime: "3D6 days" },
  { roll: 8, location: "head", injury: "Shattered neck", lethal: true, timeLimit: "stretch", effects: ["Fall down", "Immobile"], healTime: "4D6 days" },
  { roll: 9, location: "head", injury: "Crushed windpipe", lethal: true, timeLimit: "round", effects: ["STAMINA -2", "MOBILITY -2"], healTime: "3D6 days" },
  { roll: 10, location: "head", injury: "Brains blown out", lethal: true, timeLimit: null, effects: ["Instant death"], healTime: null, instantDeath: true },
];

const TORSO: CriticalInjuryEntry[] = [
  { roll: 1, location: "torso", injury: "Snapped collarbone", lethal: false, timeLimit: null, effects: ["MOBILITY -1"], healTime: "D6 days" },
  { roll: 2, location: "torso", injury: "Broken ribs", lethal: false, timeLimit: null, effects: ["STAMINA -1", "MOBILITY -1"], healTime: "2D6 days" },
  { roll: 3, location: "torso", injury: "Cracked pelvis", lethal: false, timeLimit: null, effects: ["MOBILITY -2"], healTime: "3D6 days" },
  { roll: 4, location: "torso", injury: "Bleeding gut", lethal: true, timeLimit: "shift", effects: ["STAMINA -2", "Any MOBILITY roll reopens wound"], healTime: "2D6 days" },
  { roll: 5, location: "torso", injury: "Ruptured kidney", lethal: true, timeLimit: "shift", effects: ["Suffer 1 damage at any MOBILITY roll"], healTime: "2D6 days" },
  { roll: 6, location: "torso", injury: "Punctured lung", lethal: true, timeLimit: "shift", effects: ["STAMINA -2", "MOBILITY -2"], healTime: "2D6 days" },
  { roll: 7, location: "torso", injury: "Cracked spine", lethal: true, timeLimit: "shift", effects: ["Fall down", "Immobile"], healTime: "4D6 days" },
  { roll: 8, location: "torso", injury: "Torn intestines", lethal: true, timeLimit: "stretch", effects: ["STAMINA -1", "Disease virulence -3", "Incubation one shift"], healTime: "2D6 days" },
  { roll: 9, location: "torso", injury: "Internal bleeding", lethal: true, timeLimit: "round", effects: ["Fall down", "Cannot run", "Can only crawl"], healTime: "3D6 days" },
  { roll: 10, location: "torso", injury: "Heart impaled", lethal: true, timeLimit: null, effects: ["Instant death"], healTime: null, instantDeath: true },
];

const LEGS: CriticalInjuryEntry[] = [
  { roll: 1, location: "legs", injury: "Crushed toes", lethal: false, timeLimit: null, effects: ["Running becomes a slow action", "Fall down"], healTime: "2D6 days" },
  { roll: 2, location: "legs", injury: "Dislocated knee", lethal: false, timeLimit: null, effects: ["Cannot run", "Can only crawl", "Fall down"], healTime: "D6 days" },
  { roll: 3, location: "legs", injury: "Severed tendons", lethal: false, timeLimit: null, effects: ["Running becomes a slow action", "MOBILITY -2", "Fall down"], healTime: "2D6 days" },
  { roll: 4, location: "legs", injury: "Broken shinbone", lethal: false, timeLimit: null, effects: ["Cannot run", "Can only crawl", "Fall down"], healTime: "3D6 days" },
  { roll: 5, location: "legs", injury: "Crushed ankle", lethal: false, timeLimit: null, effects: ["Cannot run", "MOBILITY -2", "Fall down"], healTime: "2D6 days" },
  { roll: 6, location: "legs", injury: "Cracked hip", lethal: false, timeLimit: null, effects: ["Cannot run", "MOBILITY -2", "Fall down"], healTime: "3D6 days" },
  { roll: 7, location: "legs", injury: "Thigh gash", lethal: true, timeLimit: "shift", effects: ["Running becomes a slow action", "MOBILITY -2", "Fall down"], healTime: "D6 days" },
  { roll: 8, location: "legs", injury: "Shattered knee", lethal: true, timeLimit: "shift", effects: ["Cannot run", "MOBILITY -2", "Fall down"], healTime: "3D6 days" },
  { roll: 9, location: "legs", injury: "Arterial bleeding", lethal: true, timeLimit: "stretch", effects: ["Running becomes a slow action", "Fall down"], healTime: "2D6 days" },
  { roll: 10, location: "legs", injury: "Severed leg", lethal: true, timeLimit: "stretch", effects: ["Cannot run", "MOBILITY -2", "Fall down"], healTime: "Permanent" },
];

const ARM: CriticalInjuryEntry[] = [
  { roll: 1, location: "arm", injury: "Dislocated shoulder", lethal: false, timeLimit: null, effects: ["RANGED COMBAT -2 with two-handed weapons", "Drop held items"], healTime: "D6 days" },
  { roll: 2, location: "arm", injury: "Slashed forearm", lethal: false, timeLimit: null, effects: ["RANGED COMBAT -2 with two-handed weapons", "Drop held items"], healTime: "2D6 days" },
  { roll: 3, location: "arm", injury: "Crushed fingers", lethal: false, timeLimit: null, effects: ["RANGED COMBAT -2 with two-handed weapons", "Drop held items"], healTime: "3D6 days" },
  { roll: 4, location: "arm", injury: "Dislocated elbow", lethal: false, timeLimit: null, effects: ["Two-handed weapons cannot be used", "Drop held items"], healTime: "D6 days" },
  { roll: 5, location: "arm", injury: "Broken forearm", lethal: false, timeLimit: null, effects: ["Two-handed weapons cannot be used", "Drop held items"], healTime: "2D6 days" },
  { roll: 6, location: "arm", injury: "Crushed wrist", lethal: false, timeLimit: null, effects: ["Two-handed weapons cannot be used", "Drop held items"], healTime: "3D6 days" },
  { roll: 7, location: "arm", injury: "Bleeding shoulder", lethal: true, timeLimit: "shift", effects: ["RANGED COMBAT -2 with two-handed weapons", "Drop held items"], healTime: "D6 days" },
  { roll: 8, location: "arm", injury: "Shattered elbow", lethal: true, timeLimit: "shift", effects: ["Two-handed weapons cannot be used", "Drop held items"], healTime: "3D6 days" },
  { roll: 9, location: "arm", injury: "Arterial bleeding", lethal: true, timeLimit: "stretch", effects: ["RANGED COMBAT -2 with two-handed weapons", "Drop held items"], healTime: "2D6 days" },
  { roll: 10, location: "arm", injury: "Severed arm", lethal: true, timeLimit: "stretch", effects: ["Two-handed weapons cannot be used", "Drop held items"], healTime: "Permanent" },
];

export const CRITICAL_INJURY_TABLES: Readonly<
  Record<HitLocation, readonly CriticalInjuryEntry[]>
> = {
  head: HEAD,
  torso: TORSO,
  legs: LEGS,
  arm: ARM,
};
