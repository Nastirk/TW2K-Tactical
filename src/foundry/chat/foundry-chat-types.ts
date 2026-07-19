export interface FoundryChatMessageData {
  content: string;
  flavor?: string;
  speaker?: unknown;
  flags?: Record<
    string,
    unknown
  >;
}

export interface FoundryChatMessageClassLike {
  create(
    data:
      FoundryChatMessageData,
  ): Promise<unknown>;

  getSpeaker?(
    options?: Record<
      string,
      unknown
    >,
  ): unknown;
}
