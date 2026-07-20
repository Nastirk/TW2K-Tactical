import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  CombatChatActionListener,
} from "../../../src/foundry/chat/combat-chat-action-listener";

describe(
  "CombatChatActionListener",
  () => {
    it(
      "reports an already-applied result as a warning instead of an unhandled rejection",
      async () => {
        let clickHandler:
          ((event: unknown) => void) |
          undefined;

        const warn = vi.fn();
        const error = vi.fn();

        const listener =
          new CombatChatActionListener(
            {
              applyResult: vi.fn()
                .mockRejectedValue(
                  new Error(
                    "Combat result has already been applied.",
                  ),
                ),
            } as never,
            {
              getMessageById: () => ({
                id: "message-1",
              }),
            },
            {
              warn,
              error,
            },
          );

        listener.register({
          addEventListener:
            (_type, handler) => {
              clickHandler = handler;
            },
        });

        const messageElement = {
          dataset: {
            messageId:
              "message-1",
          },
        };

        const button = {
          closest:
            (selector: string) =>
              selector ===
                "[data-message-id]"
                ? messageElement
                : null,
        };

        clickHandler?.({
          target: {
            closest:
              (selector: string) =>
                selector.includes(
                  "tw2k-tactical-apply-result",
                )
                  ? button
                  : null,
          },
        });

        await Promise.resolve();
        await Promise.resolve();

        expect(warn)
          .toHaveBeenCalledWith(
            "Combat result has already been applied.",
          );
        expect(error)
          .not.toHaveBeenCalled();
      },
    );
  },
);
