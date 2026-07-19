import {
  CombatChatActionController,
  type CombatChatMessageLike,
} from "./combat-chat-action-controller";

export interface ChatLogElementLike {
  addEventListener(
    type: string,
    listener:
      (event: unknown) => void,
  ): void;
}

interface ClickTargetLike {
  closest?(
    selector: string,
  ): ElementLike | null;
}

interface ElementLike {
  dataset?: Record<
    string,
    string | undefined
  >;
  closest?(
    selector: string,
  ): ElementLike | null;
}

export interface CombatMessageResolver {
  getMessageById(
    messageId: string,
  ): CombatChatMessageLike | undefined;
}

export class CombatChatActionListener {
  constructor(
    private readonly controller:
      CombatChatActionController,
    private readonly messageResolver:
      CombatMessageResolver,
  ) {}

  register(
    root:
      ChatLogElementLike,
  ): void {
    root.addEventListener(
      "click",
      (event) => {
        void this.onClick(
          event,
        );
      },
    );
  }

  private async onClick(
    event: unknown,
  ): Promise<void> {
    const target =
      (
        event as {
          target?:
            ClickTargetLike;
        }
      ).target;

    const button =
      target?.closest?.(
        '[data-action="tw2k-tactical-apply-result"]',
      );

    if (!button) {
      return;
    }

    const messageElement =
      button.closest?.(
        "[data-message-id]",
      );

    const messageId =
      messageElement
        ?.dataset
        ?.messageId;

    if (!messageId) {
      throw new Error(
        "Unable to determine chat message ID.",
      );
    }

    const message =
      this.messageResolver
        .getMessageById(
          messageId,
        );

    if (!message) {
      throw new Error(
        `Chat message not found: ${messageId}`,
      );
    }

    await this.controller
      .applyResult({
        message,
      });
  }
}
