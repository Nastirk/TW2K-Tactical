import type { SourceSection } from "./types";

/** Complete high-level inventory of both supplied manuals for conversion planning. */
export const MANUAL_SOURCE_INDEX: readonly SourceSection[] = [
  { id: "players.introduction", manual: "players", title: "You're On Your Own Now", startPage: 5, endPage: 11, classification: "advice" },
  { id: "players.characters", manual: "players", title: "Player Characters", startPage: 13, endPage: 41, classification: "mechanics" },
  { id: "players.skills", manual: "players", title: "Skills & Specialties", startPage: 43, endPage: 51, classification: "mechanics" },
  { id: "players.combat", manual: "players", title: "Combat & Damage", startPage: 53, endPage: 87, classification: "mechanics" },
  { id: "players.gear", manual: "players", title: "Weapons, Vehicles & Gear", startPage: 89, endPage: 131, classification: "reference-data" },
  { id: "players.base", manual: "players", title: "Home Base", startPage: 132, endPage: 136, classification: "mechanics" },
  { id: "players.travel", manual: "players", title: "Travel", startPage: 137, endPage: 150, classification: "mechanics" },
  { id: "referees.world", manual: "referees", title: "The World at War", startPage: 5, endPage: 25, classification: "setting" },
  { id: "referees.running", manual: "referees", title: "Your Job as Referee", startPage: 27, endPage: 50, classification: "advice" },
  { id: "referees.factions", manual: "referees", title: "Factions & Forces", startPage: 55, endPage: 67, classification: "reference-data" },
  { id: "referees.scenarios", manual: "referees", title: "Scenario Sites", startPage: 69, endPage: 101, classification: "scenario" },
  { id: "referees.solo", manual: "referees", title: "Appendix I: Solo Rules", startPage: 102, endPage: 106, classification: "mechanics" },
  { id: "referees.conversion", manual: "referees", title: "Appendix II: Conversion Rules", startPage: 107, endPage: 110, classification: "mechanics" },
  { id: "referees.notes", manual: "referees", title: "Appendix III: Designer's Notes", startPage: 111, endPage: 112, classification: "advice" },
];
