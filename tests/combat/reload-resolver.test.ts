import {
  describe,
  expect,
  it,
} from "vitest";
import {
  ReloadResolver,
} from "../../src/combat/reload-resolver";
import {
  DiceModifierApplicator,
} from "../../src/dice/modifier-applicator";
import {
  DiceEngine,
  type DieRoller,
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

function resolver(rolls: number[]) {
  return new ReloadResolver(
    new DiceEngine(
      new SequenceRoller(rolls),
    ),
    new DiceModifierApplicator(),
  );
}

const base = {
  attributeDie: 8 as const,
  skillDie: 8 as const,
  hasReloaderSpecialty: false,
  hasSlowActionAvailable: true,
};

describe("ReloadResolver", () => {
  it("uses a fast action on success", async () => {
    const result =
      await resolver([6, 2])
        .resolve(base);

    expect(result.success).toBe(true);
    expect(result.completed).toBe(true);
    expect(result.actionCost).toBe("fast");
  });

  it("uses a slow action on failure when one is available", async () => {
    const result =
      await resolver([2, 3])
        .resolve(base);

    expect(result.success).toBe(false);
    expect(result.completed).toBe(true);
    expect(result.actionCost).toBe("slow");
  });

  it("forfeits a failed attempt when no slow action remains", async () => {
    const result =
      await resolver([2, 3])
        .resolve({
          ...base,
          hasSlowActionAvailable: false,
        });

    expect(result.completed).toBe(false);
    expect(result.actionCost).toBeUndefined();
  });

  it("applies the Reloader +1 before rolling", async () => {
    const result =
      await resolver([2, 3])
        .resolve({
          ...base,
          hasReloaderSpecialty: true,
        });

    expect(result.reloaderModifier).toBe(1);
    expect(result.finalPool.dice).toEqual([10, 8]);
  });
});
