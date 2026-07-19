import type {
  FoundryChatMessageClassLike,
} from "./foundry-chat-types";

export interface PublishCombatChatRequest {
  content: string;
  attackerActor?: unknown;
  metadata?: unknown;
}

export class FoundryChatMessagePublisher {
  constructor(
    private readonly ChatMessage:
      FoundryChatMessageClassLike,
  ) {}

  async publish(
    request:
      PublishCombatChatRequest,
  ): Promise<void> {
    const speaker =
      this.ChatMessage
        .getSpeaker?.({
          actor:
            request.attackerActor,
        });

    await this.ChatMessage.create({
      content:
        request.content,

      flavor:
        "TW2K Tactical",

      speaker,

      flags: {
        "tw2k-tactical": {
          combatResult:
            request.metadata ??
            {},
        },
      },
    });
  }
}