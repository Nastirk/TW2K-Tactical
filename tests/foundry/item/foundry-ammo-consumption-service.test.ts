import {
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  FoundryAmmoConsumptionService,
} from "../../../src/foundry/item/foundry-ammo-consumption-service";

const result = {
  ammunitionItemId: "mag",
  rateOfFire: 3,
  roundsBefore: 20,
  ammoDice: 1,
  rolls: [4],
  successes: 0,
  allocation: "damage" as const,
  damageSuccesses: 0,
  additionalHitSuccesses: 0,
  roundsSpent: 5,
  roundsRemaining: 15,
  empty: false,
};

describe("FoundryAmmoConsumptionService", () => {
  it("persists the remaining rounds to the loaded item", async () => {
    const update =
      vi.fn()
        .mockResolvedValue(undefined);

    await new FoundryAmmoConsumptionService()
      .consume(
        {
          items: [{
            id: "mag",
            type: "gear",
            system: {
              ammo: {
                value: 20,
                max: 30,
              },
            },
            update,
          }],
        },
        result,
      );

    expect(update).toHaveBeenCalledWith({
      "system.ammo.value": 15,
    });
  });

  it("refuses a stale update when the loaded value changed after the dialog opened", async () => {
    const update = vi.fn();

    await expect(
      new FoundryAmmoConsumptionService()
        .consume(
          {
            items: [{
              id: "mag",
              type: "gear",
              system: {
                ammo: {
                  value: 18,
                  max: 30,
                },
              },
              update,
            }],
          },
          result,
        ),
    ).rejects.toThrow(
      "changed while the attack was resolving",
    );

    expect(update).not.toHaveBeenCalled();
  });
});
