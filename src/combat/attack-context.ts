export type RangeBand =
  | "short"
  | "medium"
  | "long"
  | "extreme"
  | "out-of-range";

export type CombatMode =
  | "ranged"
  | "close-combat";

export interface AttackContext {
  attackerId: string;
  targetId: string;
  weaponId?: string;
  distanceHexes: number;
  combatMode: CombatMode;
  rangeBand?: RangeBand;
  sameHex: boolean;
}
