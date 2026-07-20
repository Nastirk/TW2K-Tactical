import { describe, expect, it, vi } from "vitest";
import { registerFoundryWeaponAccessoryAttachmentHook } from "../../../src/foundry/item/foundry-weapon-accessory-attachment-hook";

describe("registerFoundryWeaponAccessoryAttachmentHook", () => {
  it("renders a compatible-weapon selector and persists the selected weapon", async () => {
    const callbacks = new Map<
      string,
      (application: unknown, html: unknown) => unknown
    >();

    const hooks = {
      on: vi.fn((name: string, callback: (application: unknown, html: unknown) => unknown) => {
        callbacks.set(name, callback);
      }),
    };

    const setFlag = vi.fn().mockResolvedValue(undefined);
    const accessory = {
      id: "scope-1",
      type: "gear",
      name: "Telescopic Sight (Scope)",
      setFlag,
      parent: {
        items: [
          {
            id: "m16",
            type: "weapon",
            name: "M16A1",
            system: { props: { scope: true } },
          },
          {
            id: "pistol",
            type: "weapon",
            name: "M1911A1",
            system: { props: { scope: false } },
          },
        ],
      },
    };

    let appended = "";
    let changeHandler: ((event: unknown) => unknown) | undefined;

    const emptyCollection = {
      length: 0,
      append: vi.fn(),
      on: vi.fn(),
    };
    const formCollection = {
      length: 1,
      append: vi.fn((content: string) => {
        appended += content;
      }),
      on: vi.fn(),
    };
    const selectCollection = {
      length: 1,
      append: vi.fn(),
      on: vi.fn((eventName: string, handler: (event: unknown) => unknown) => {
        if (eventName === "change") {
          changeHandler = handler;
        }
      }),
    };

    const html = {
      find: (selector: string) => {
        if (selector === "form") return formCollection;
        if (selector === '[data-tw2k-tactical-action="accessory-attachment"]') {
          return selectCollection;
        }
        return emptyCollection;
      },
    };

    registerFoundryWeaponAccessoryAttachmentHook(hooks);

    callbacks.get("renderItemSheet")?.(
      { object: accessory },
      html,
    );

    expect(appended).toContain("TW2K Tactical — Attached to");
    expect(appended).toContain("M16A1");
    expect(appended).not.toContain("M1911A1");

    await changeHandler?.({
      currentTarget: { value: "m16" },
    });

    expect(setFlag).toHaveBeenCalledWith(
      "tw2k-tactical",
      "attachedWeaponId",
      "m16",
    );
  });
});
