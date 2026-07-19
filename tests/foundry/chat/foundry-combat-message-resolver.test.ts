import {
  describe,
  expect,
  it,
} from "vitest";

import {
  FoundryCombatMessageResolver,
} from "../../../src/foundry/chat/foundry-combat-message-resolver";

describe(
  "FoundryCombatMessageResolver",
  () => {
    it(
      "resolves chat messages by id",
      () => {
        const message = {
          id: "m1",
        };

        const resolver =
          new FoundryCombatMessageResolver({
            get:
              (id) =>
                id === "m1"
                  ? message
                  : undefined,
          });

        expect(
          resolver.getMessageById(
            "m1",
          ),
        ).toBe(message);
      },
    );
  },
);
