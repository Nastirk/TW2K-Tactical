import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  FoundryChatMessagePublisher,
} from "../../../src/foundry/chat/foundry-chat-message-publisher";

describe(
  "FoundryChatMessagePublisher",
  () => {
    it(
      "creates a chat message with module flags",
      async () => {
        const create =
          vi.fn()
            .mockResolvedValue(
              {},
            );

        const publisher =
          new FoundryChatMessagePublisher({
            create,
            getSpeaker:
              () => ({
                actor: "a",
              }),
          });

        await publisher.publish({
          content:
            "<article>Result</article>",
          attackerActor: {
            id: "a",
          },
          metadata: {
            hit: true,
          },
        });

        expect(
          create,
        ).toHaveBeenCalledWith({
          content:
            "<article>Result</article>",
          flavor:
            "TW2K Tactical",
          speaker: {
            actor: "a",
          },
          flags: {
            "tw2k-tactical": {
              combatResult: {
                hit: true,
              },
            },
          },
        });
      },
    );
  },
);
