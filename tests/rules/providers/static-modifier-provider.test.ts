import {
  describe,
  expect,
  it,
} from "vitest";

import {
  StaticModifierProvider,
} from "../../../src/rules/providers/static-modifier-provider";

describe(
  "StaticModifierProvider",
  () => {
    it(
      "returns a copy of its modifiers",
      () => {
        const provider =
          new StaticModifierProvider([
            {
              category:
                "ranged-combat",
              source:
                "called-shot",
              value: -2,
              description:
                "Called shot",
            },
          ]);

        const result =
          provider.getModifiers(
            {} as never,
          );

        expect(result).toEqual([
          {
            category:
              "ranged-combat",
            source:
              "called-shot",
            value: -2,
            description:
              "Called shot",
          },
        ]);
      },
    );
  },
);
