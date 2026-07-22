export type ModifierProvenance =
  | "automatic"
  | "inferred"
  | "input";

export interface Modifier {
  source: string;
  category: string;
  value: number;
  description: string;
  provenance?: ModifierProvenance;
}
