import { describe, expect, it, vi } from "vitest";
import { registerFoundryWeaponAccessoryAttachmentHook } from "../../../src/foundry/item/foundry-weapon-accessory-attachment-hook";

describe("registerFoundryWeaponAccessoryAttachmentHook", () => {
  it("renders all actor weapons and mirrors the selected attachment onto the weapon property", async () => {
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
    const m16Update = vi.fn().mockResolvedValue(undefined);
    const m4Update = vi.fn().mockResolvedValue(undefined);
    const accessory = {
      id: "scope-1",
      type: "gear",
      name: "Telescopic Sight (Scope)",
      setFlag,
      parent: {
        items: [] as unknown[],
      },
    };
    const m16 = {
      id: "m16",
      type: "weapon",
      name: "M16A1",
      system: { props: { scope: true } },
      update: m16Update,
    };
    const m4 = {
      id: "m4",
      type: "weapon",
      name: "M4",
      system: { props: { scope: false } },
      update: m4Update,
    };
    accessory.parent.items = [accessory, m16, m4];

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
    expect(appended).toContain("M4");

    await changeHandler?.({
      currentTarget: { value: "m4" },
    });

    expect(setFlag).toHaveBeenCalledWith(
      "tw2k-tactical",
      "attachedWeaponId",
      "m4",
    );
    expect(m4Update).toHaveBeenCalledWith({
      "system.props.scope": true,
    });
  });
});
