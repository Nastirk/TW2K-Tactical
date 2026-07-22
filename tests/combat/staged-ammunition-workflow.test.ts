import {
  describe,
  expect,
  it,
} from "vitest";
import {
  AmmoAttackResolver,
} from "../../src/combat/ammo-resolver";
import {
  ArmorResolver,
} from "../../src/combat/armor-resolver";
import {
  AttackContextBuilder,
} from "../../src/combat/attack-context-builder";
import {
  CriticalInjuryResolver,
} from "../../src/combat/critical-injury-resolver";
import {
  CriticalInjuryRollResolver,
} from "../../src/combat/critical-injury-roll-resolver";
import {
  CriticalInjuryTableResolver,
} from "../../src/combat/critical-injury-table-resolver";
import {
  DamageResolver,
} from "../../src/combat/damage-resolver";
import {
  DeathSaveResolver,
} from "../../src/combat/death-save-resolver";
import {
  HitLocationResolver,
} from "../../src/combat/hit-location-resolver";
import {
  PostHitResolver,
} from "../../src/combat/post-hit-resolver";
import {
  RangedAttackResolver,
} from "../../src/combat/ranged-attack-resolver";
import {
  StagedEndToEndRangedCombatWorkflow,
} from "../../src/combat/staged-end-to-end-ranged-combat-workflow";
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

function createWorkflow(
  attackRolls: number[],
  ammoRolls: number[],
) {
  const attackResolver =
    new RangedAttackResolver(
      new AttackContextBuilder({
        getDistanceHexes: () => 1,
        getCombatMode: () => "ranged",
        getRangeBand: () => "short",
      }),
      [],
      new DiceModifierApplicator(),
      new DiceEngine(
        new SequenceRoller(
          attackRolls,
        ),
      ),
    );

  return new StagedEndToEndRangedCombatWorkflow(
    attackResolver,
    new PostHitResolver(
      new HitLocationResolver({
        rollD6: async () => 3,
      }),
      new DamageResolver(),
      new ArmorResolver(),
      new CriticalInjuryResolver(),
    ),
    new CriticalInjuryRollResolver(
      { rollD10: async () => 1 },
      new CriticalInjuryTableResolver(),
    ),
    new DeathSaveResolver(),
    new AmmoAttackResolver(
      new SequenceRoller(
        ammoRolls,
      ),
    ),
  );
}

const request = {
  attackerId: "attacker",
  targetId: "target",
  targetActorId: "target",
  weaponId: "weapon",
  baseAttributeDie: 8 as const,
  baseSkillDie: 8 as const,
  weaponBaseDamage: 2,
  critThreshold: 4,
  weaponArmorModifier: 0,
  ammunition: {
    ammunitionItemId: "mag",
    rateOfFire: 3,
    roundsBefore: 20,
    ammoDice: 1,
    allocation: "damage" as const,
    slowAim: false,
  },
};

describe("staged ammunition workflow", () => {
  it("adds damage-allocated ammo successes to a successful hit", async () => {
    const result =
      await createWorkflow(
        [6, 2],
        [6],
      ).resolve(request);

    expect(result.hit).toBe(true);
    expect(result.ammunition?.successes).toBe(1);
    expect(result.postHit?.damage.damageBeforeArmor).toBe(3);
  });

  it("reports reserved additional-hit successes without increasing primary damage", async () => {
    const result =
      await createWorkflow(
        [6, 2],
        [6],
      ).resolve({
        ...request,
        ammunition: {
          ...request.ammunition,
          allocation: "additional-hits",
        },
      });

    expect(result.ammunition?.additionalHitSuccesses).toBe(1);
    expect(result.postHit?.damage.damageBeforeArmor).toBe(2);
  });

  it("keeps ammo results on a miss without applying future suppression rules", async () => {
    const result =
      await createWorkflow(
        [2, 3],
        [6],
      ).resolve(request);

    expect(result.hit).toBe(false);
    expect(result.postHit).toBeUndefined();
    expect(result.ammunition?.successes).toBe(1);
    expect(result.ammunition?.roundsSpent).toBe(6);
  });
});
