import { describe, expect, it, vi } from "vitest";
import { FoundryJQueryWeaponSheetAdapter } from "../../../src/foundry/item/foundry-weapon-sheet-adapter";

describe("FoundryJQueryWeaponSheetAdapter", () => {
  it("adds and wires a Tactical Attack button for legacy jQuery sheets", async () => {
    let buttonExists = false;
    let clickHandler:
      | ((event: unknown) => unknown)
      | undefined;

    const header = {
      length: 1,
      append: vi.fn(() => {
        buttonExists = true;
      }),
      on: vi.fn(),
    };

    const button = {
      get length() {
        return buttonExists ? 1 : 0;
      },
      append: vi.fn(),
      on: vi.fn(
        (
          _eventName: string,
          handler: (event: unknown) => unknown,
        ) => {
          clickHandler = handler;
        },
      ),
    };

    const empty = {
      length: 0,
      append: vi.fn(),
      on: vi.fn(),
    };

    const html = {
      find: (selector: string) => {
        if (selector === ".sheet-header") {
          return header;
        }

        if (
          selector ===
          '[data-tw2k-tactical-action="attack"]'
        ) {
          return button;
        }

        return empty;
      },
    };

    const actor = { id: "actor" };
    const weapon = {
      type: "weapon",
      parent: actor,
    };

    const context =
      new FoundryJQueryWeaponSheetAdapter().resolve(
        { object: weapon },
        html,
      );

    expect(context).not.toBeNull();

    const callback =
      vi.fn().mockResolvedValue(undefined);

    context!.addAttackAction(callback);

    expect(header.append).toHaveBeenCalledOnce();
    expect(button.on).toHaveBeenCalledWith(
      "click",
      expect.any(Function),
    );

    const preventDefault = vi.fn();

    await clickHandler?.({
      preventDefault,
    });

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledOnce();
  });

  it("adds and wires the attack button for DOM/ApplicationV2-style sheets", async () => {
    let buttonExists = false;
    let clickHandler:
      | ((event: unknown) => unknown)
      | undefined;

    const button = {
      addEventListener: vi.fn(
        (
          _type: string,
          handler: (event: unknown) => unknown,
        ) => {
          clickHandler = handler;
        },
      ),
    };

    const header = {
      insertAdjacentHTML: vi.fn(() => {
        buttonExists = true;
      }),
    };

    const root = {
      querySelector: (selector: string) => {
        if (selector === ".sheet-header") {
          return header;
        }

        if (
          selector ===
          '[data-tw2k-tactical-action="attack"]'
        ) {
          return buttonExists ? button : null;
        }

        return null;
      },
    };

    const callback =
      vi.fn().mockResolvedValue(undefined);

    const context =
      new FoundryJQueryWeaponSheetAdapter().resolve(
        {
          document: {
            type: "Weapon",
            parent: { id: "actor" },
          },
        },
        root,
      );

    expect(context).not.toBeNull();

    context!.addAttackAction(callback);

    expect(header.insertAdjacentHTML).toHaveBeenCalledOnce();
    expect(button.addEventListener).toHaveBeenCalledWith(
      "click",
      expect.any(Function),
    );

    const preventDefault = vi.fn();
    await clickHandler?.({ preventDefault });

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledOnce();
  });

  it("ignores non-weapon item sheets", () => {
    const result =
      new FoundryJQueryWeaponSheetAdapter().resolve(
        {
          object: {
            type: "armor",
            parent: {},
          },
        },
        {
          find: vi.fn(),
        },
      );

    expect(result).toBeNull();
  });

  it("adds and wires a Tactical Reload button", async () => {
    let buttonExists = false;
    let clickHandler:
      | ((event: unknown) => unknown)
      | undefined;
    const header = {
      length: 1,
      append: vi.fn(() => {
        buttonExists = true;
      }),
      on: vi.fn(),
    };
    const button = {
      get length() {
        return buttonExists ? 1 : 0;
      },
      append: vi.fn(),
      on: vi.fn(
        (
          _eventName: string,
          handler: (event: unknown) => unknown,
        ) => {
          clickHandler = handler;
        },
      ),
    };
    const empty = {
      length: 0,
      append: vi.fn(),
      on: vi.fn(),
    };
    const html = {
      find: (selector: string) => {
        if (selector === ".sheet-header") {
          return header;
        }
        if (
          selector ===
          '[data-tw2k-tactical-action="reload"]'
        ) {
          return button;
        }
        return empty;
      },
    };
    const context =
      new FoundryJQueryWeaponSheetAdapter()
        .resolve(
          {
            object: {
              type: "weapon",
              parent: { id: "actor" },
            },
          },
          html,
        );
    const callback =
      vi.fn()
        .mockResolvedValue(undefined);

    context?.addReloadAction?.(
      callback,
    );
    await clickHandler?.({
      preventDefault: vi.fn(),
    });

    expect(header.append).toHaveBeenCalledWith(
      expect.stringContaining(
        'data-tw2k-tactical-action="reload"',
      ),
    );
    expect(callback).toHaveBeenCalledOnce();
  });
});
