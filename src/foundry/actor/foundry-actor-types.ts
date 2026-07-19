export interface FoundryActorLike {
  id: string;
  system?: unknown;
  flags?: unknown;

  update(
    changes:
      Record<string, unknown>,
  ): Promise<unknown>;
}

export interface FoundryGameLike {
  actors?: {
    get(
      id: string,
    ): FoundryActorLike | undefined;
  };
}
