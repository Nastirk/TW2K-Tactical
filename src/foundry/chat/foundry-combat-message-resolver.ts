import type {
  CombatMessageResolver,
} from "./combat-chat-action-listener";
import type {
  CombatChatMessageLike,
} from "./combat-chat-action-controller";

export interface FoundryMessagesLike {
  get(
    id: string,
  ):
    | CombatChatMessageLike
    | undefined;
}

export class FoundryCombatMessageResolver
  implements CombatMessageResolver
{
  constructor(
    private readonly messages:
      FoundryMessagesLike,
  ) {}

  getMessageById(
    messageId: string,
  ):
    | CombatChatMessageLike
    | undefined {
    return this.messages.get(
      messageId,
    );
  }
}
