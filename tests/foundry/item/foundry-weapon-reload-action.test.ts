import {
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type {
  DieRoller,
} from "../../../src/dice/roller";
import type {
  FoundryDialogConfigLike,
} from "../../../src/foundry/dialog/foundry-dialog-types";
import {
  FoundryWeaponReloadAction,
} from "../../../src/foundry/item/foundry-weapon-reload-action";

class SequenceRoller
  implements DieRoller
{
  constructor(
    private readonly values:
      number[],
  ) {}

  async rollDie(): Promise<number> {
    return this.values.shift()!;
  }
}

function dialogClass(
  hasSlowActionAvailable: boolean,
) {
  return class DialogStub {
    constructor(
      private readonly config:
        FoundryDialogConfigLike,
    ) {}

    render(): void {
      void this.config.buttons
        .reload
        ?.callback?.({
          formData: {
            get: (name: string) => {
              if (
                name ===
                "reloadAmmunitionItemId"
              ) {
                return "spare";
              }

              if (
                name ===
                  "hasSlowActionAvailable" &&
                hasSlowActionAvailable
              ) {
                return "on";
              }

              return undefined;
            },
          },
        });
    }
  };
}

function fixtures() {
  const weaponUpdate =
    vi.fn()
      .mockResolvedValue(undefined);
  const actor = {
    id: "actor",
    name: "Soldier",
    type: "character",
    system: {
      attributes: {
        agl: { value: "C" },
      },
      skills: {
        rangedCombat: {
          value: "C",
        },
      },
    },
    items: [
      {
        id: "loaded",
        name: "5.56x45mm Magazine",
        type: "ammunition",
        system: {
          itemType: "5.56x45mm",
          ammo: {
            value: 5,
            max: 30,
          },
        },
      },
      {
        id: "spare",
        name: "5.56x45mm Magazine",
        type: "ammunition",
        system: {
          itemType: "5.56x45mm",
          ammo: {
            value: 30,
            max: 30,
          },
        },
      },
      {
        id: "reloader",
        name: "Reloader",
        type: "specialty",
      },
    ],
  };
  const weapon = {
    id: "weapon",
    name: "M16A2",
    type: "weapon",
    system: {
      rof: 3,
      ammo: "5.56x45mm",
      mag: {
        target: "loaded",
        max: 30,
      },
    },
    update: weaponUpdate,
  };

  return {
    actor,
    weapon,
    weaponUpdate,
  };
}

describe("FoundryWeaponReloadAction", () => {
  it("updates the magazine target after a successful fast reload and reports Reloader", async () => {
    const {
      actor,
      weapon,
      weaponUpdate,
    } = fixtures();
    const create =
      vi.fn()
        .mockResolvedValue(undefined);

    const completed =
      await new FoundryWeaponReloadAction(
        dialogClass(true) as never,
        { create },
        new SequenceRoller([6, 2]),
        {
          warn: vi.fn(),
          error: vi.fn(),
        },
      ).launch(actor, weapon);

    expect(completed).toBe(true);
    expect(weaponUpdate).toHaveBeenCalledWith({
      "system.mag.target": "spare",
    });
    expect(
      create.mock.calls[0]?.[0]
        .content,
    ).toContain("+1 Reloader");
    expect(
      create.mock.calls[0]?.[0]
        .content,
    ).toContain("fast action");
  });

  it("does not change the magazine after a failed roll when no slow action remains", async () => {
    const {
      actor,
      weapon,
      weaponUpdate,
    } = fixtures();
    const create =
      vi.fn()
        .mockResolvedValue(undefined);

    const completed =
      await new FoundryWeaponReloadAction(
        dialogClass(false) as never,
        { create },
        new SequenceRoller([2, 3]),
        {
          warn: vi.fn(),
          error: vi.fn(),
        },
      ).launch(actor, weapon);

    expect(completed).toBe(false);
    expect(weaponUpdate).not.toHaveBeenCalled();
    expect(
      create.mock.calls[0]?.[0]
        .content,
    ).toContain("forfeited");
  });
});
