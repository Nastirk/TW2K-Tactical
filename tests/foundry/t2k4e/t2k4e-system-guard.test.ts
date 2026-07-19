import {
  describe,
  expect,
  it,
} from "vitest";

import {
  assertT2K4ESystem,
} from "../../../src/foundry/t2k4e/t2k4e-system-guard";

describe(
  "assertT2K4ESystem",
  () => {
    it(
      "accepts the official t2k4e system",
      () => {
        expect(() =>
          assertT2K4ESystem({
            system: {
              id: "t2k4e",
            },
          }),
        ).not.toThrow();
      },
    );

    it(
      "rejects other systems",
      () => {
        expect(() =>
          assertT2K4ESystem({
            system: {
              id: "other",
            },
          }),
        ).toThrow(
          'TW2K Tactical requires the official Foundry system "t2k4e".',
        );
      },
    );
  },
);
