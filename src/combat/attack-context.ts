export type RangeBand =
  | "close"
  | "short"
  | "medium"
  | "long"
  | "extreme";

export interface AttackContext {
  attackerId: string;
  targetId: string;
  weaponId: string;

  distance: number;
  rangeBand: RangeBand;
}