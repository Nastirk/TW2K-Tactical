export interface T2K4EItemLike {
  id: string;
  name?: string;
  type: string;
  system?: Record<string, unknown>;
}

export interface T2K4EActorLike {
  id: string;
  name?: string;
  type: string;
  system?: Record<string, unknown>;
  items?: Iterable<T2K4EItemLike>;
}

export interface T2K4EGameLike {
  system?: {
    id?: string;
  };
  actors?: {
    get(
      id: string,
    ): T2K4EActorLike | undefined;
  };
}

export type T2KAttributeKey =
  | "str"
  | "agl"
  | "int"
  | "emp";

export type T2KSkillKey =
  | "closeCombat"
  | "heavyWeapons"
  | "stamina"
  | "driving"
  | "rangedCombat"
  | "mobility"
  | "recon"
  | "survival"
  | "tech"
  | "command"
  | "medicalAid"
  | "persuasion";
