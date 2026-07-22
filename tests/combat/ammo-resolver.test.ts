import {
  describe,
  expect,
  it,
} from "vitest";
import {
  AmmoAttackResolver,
  getMaximumAmmoDice,
} from "../../src/combat/ammo-resolver";
import type {
  DieRoller,
} from "../../src/dice/roller";

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

const base = {
  ammunitionItemId: "mag-1",
  rateOfFire: 3,
  roundsBefore: 20,
  ammoDice: 0,
  allocation: "damage" as const,
  slowAim: false,
};

describe("AmmoAttackResolver", () => {
  it("caps ammo dice by RoF and the rounds that remain after the attack round", () => {
    expect(getMaximumAmmoDice(5, 3)).toBe(2);
    expect(getMaximumAmmoDice(2, 30)).toBe(2);
    expect(getMaximumAmmoDice(4, 1)).toBe(0);
  });

  it("spends one round when no ammo dice are rolled", async () => {
    const result =
      await new AmmoAttackResolver(
        new SequenceRoller([]),
      ).resolve(base);

    expect(result.rolls).toEqual([]);
    expect(result.roundsSpent).toBe(1);
    expect(result.roundsRemaining).toBe(19);
  });

  it("rolls D6s separately, counts sixes, and spends one plus their sum", async () => {
    const result =
      await new AmmoAttackResolver(
        new SequenceRoller([6, 2, 6]),
      ).resolve({
        ...base,
        ammoDice: 3,
      });

    expect(result.rolls).toEqual([6, 2, 6]);
    expect(result.successes).toBe(2);
    expect(result.damageSuccesses).toBe(2);
    expect(result.roundsSpent).toBe(15);
    expect(result.roundsRemaining).toBe(5);
  });

  it("caps expenditure at the rounds actually loaded", async () => {
    const result =
      await new AmmoAttackResolver(
        new SequenceRoller([6, 6]),
      ).resolve({
        ...base,
        roundsBefore: 3,
        ammoDice: 2,
      });

    expect(result.roundsSpent).toBe(3);
    expect(result.roundsRemaining).toBe(0);
    expect(result.empty).toBe(true);
  });

  it("reserves successes for manual additional hits without adding damage", async () => {
    const result =
      await new AmmoAttackResolver(
        new SequenceRoller([6]),
      ).resolve({
        ...base,
        ammoDice: 1,
        allocation: "additional-hits",
      });

    expect(result.damageSuccesses).toBe(0);
    expect(result.additionalHitSuccesses).toBe(1);
  });

  it("blocks empty weapons, over-cap requests, and ammo dice with slow aim", async () => {
    const resolver =
      new AmmoAttackResolver(
        new SequenceRoller([]),
      );

    await expect(
      resolver.resolve({
        ...base,
        roundsBefore: 0,
      }),
    ).rejects.toThrow("weapon is empty");

    await expect(
      resolver.resolve({
        ...base,
        roundsBefore: 2,
        ammoDice: 2,
      }),
    ).rejects.toThrow("cannot exceed 1");

    await expect(
      resolver.resolve({
        ...base,
        ammoDice: 1,
        slowAim: true,
      }),
    ).rejects.toThrow(
      "Slow telescopic aim",
    );
  });
});
