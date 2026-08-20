import {
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  OfficialAttackCorrelationObserver,
  RESOLUTION_PLAN_FLAG_KEY,
  RESOLUTION_PLAN_FLAG_SCOPE,
  RESOLUTION_PLAN_ROLL_OPTION,
  ResolutionPlanAssociationStore,
} from "../../../src/foundry/t2k4e/official-attack-association";
import {
  OfficialT2K4EAttackAdapterV1,
} from "../../../src/foundry/t2k4e/official-t2k4e-attack-adapter";
import {
  ResolutionPlanFactory,
  type ResolutionPlan,
} from "../../../src/foundry/t2k4e/resolution-plan";

function createPlan(
  planId: string,
  overrides: Partial<ResolutionPlan> = {},
): ResolutionPlan {
  return {
    ...new ResolutionPlanFactory({
      create: () => planId,
    }).create({
      identity: {
        actorId: "actor",
        itemId: "weapon",
        tokenKey: "Scene.scene.Token.token",
        sceneId: "scene",
        tokenId: "token",
      },
      contextualModifiers: [{
        id: "range",
        label: "Range",
        value: -1,
        eligibleForOfficialModifier: true,
        provenance: "automatic",
      }],
      evidence: [{
        key: "range-band",
        label: "Range band",
        value: "long",
        provenance: "automatic",
      }],
    }),
    ...overrides,
  };
}

function createMessage(
  id: string,
  planId?: string,
) {
  const flags = {
    t2k4e: {
      data: {
        ammo: "magazine",
        ammoSpent: -4,
      },
    },
  };
  const roll = {
    formula: "d10+d8+da",
    options: {
      actorId: "actor",
      itemId: "weapon",
      tokenKey: "Scene.scene.Token.token",
      sceneId: "scene",
      tokenId: "token",
      ...(planId
        ? {
            [RESOLUTION_PLAN_ROLL_OPTION]: planId,
          }
        : {}),
    },
  };
  const update = vi.fn(async (changes: Record<string, unknown>) => {
    const flagPath =
      `flags.${RESOLUTION_PLAN_FLAG_SCOPE}.${RESOLUTION_PLAN_FLAG_KEY}`;

    if (flagPath in changes) {
      (flags as Record<string, unknown>)[
        RESOLUTION_PLAN_FLAG_SCOPE
      ] = {
        [RESOLUTION_PLAN_FLAG_KEY]:
          changes[flagPath],
      };
    }
  });

  return {
    id,
    documentName: "ChatMessage",
    rolls: [roll],
    flags,
    update,
  };
}

describe("OfficialT2K4EAttackAdapterV1", () => {
  it("correlates the exact returned message and preserves official ammo flags", async () => {
    const associations =
      new ResolutionPlanAssociationStore();
    const adapter =
      new OfficialT2K4EAttackAdapterV1(
        associations,
      );
    const plan = createPlan("plan-1");
    const message = createMessage("message-1");
    const rollAttack = vi.fn()
      .mockResolvedValue(message);

    const commit = await adapter.execute({
      plan,
      actor: { id: "actor" },
      item: {
        id: "weapon",
        rollAttack,
      },
    });

    expect(commit?.message).toBe(message);
    expect(rollAttack).toHaveBeenCalledWith(
      { modifier: -1 },
      { id: "actor" },
    );
    expect(
      associations.getByMessageId("message-1"),
    ).toBe(plan);
    expect(
      message.rolls[0].options[
        RESOLUTION_PLAN_ROLL_OPTION
      ],
    ).toBe("plan-1");
    expect(message.flags.t2k4e.data).toEqual({
      ammo: "magazine",
      ammoSpent: -4,
    });
    expect(message.update).toHaveBeenCalledWith(
      expect.objectContaining({
        [`flags.${RESOLUTION_PLAN_FLAG_SCOPE}.${RESOLUTION_PLAN_FLAG_KEY}`]:
          plan,
      }),
    );
  });

  it("does not call the official attack for a blocked plan", async () => {
    const rollAttack = vi.fn();
    const plan = createPlan("blocked", {
      blockers: [{
        code: "blocked-los",
        message: "Line of sight is blocked.",
        kind: "hard",
      }],
    });

    const result = await new OfficialT2K4EAttackAdapterV1(
      new ResolutionPlanAssociationStore(),
    ).execute({
      plan,
      actor: { id: "actor" },
      item: { id: "weapon", rollAttack },
    });

    expect(result).toBeUndefined();
    expect(rollAttack).not.toHaveBeenCalled();
  });

  it("does not associate a cancelled official attack", async () => {
    const associations =
      new ResolutionPlanAssociationStore();
    const plan = createPlan("cancelled");

    const result = await new OfficialT2K4EAttackAdapterV1(
      associations,
    ).execute({
      plan,
      actor: { id: "actor" },
      item: {
        id: "weapon",
        rollAttack: vi.fn()
          .mockResolvedValue(undefined),
      },
    });

    expect(result).toBeUndefined();
    expect(
      associations.getByPlanId("cancelled"),
    ).toBeUndefined();
  });

  it("keeps concurrent same-actor and same-weapon attacks correlated by return value", async () => {
    const associations =
      new ResolutionPlanAssociationStore();
    const adapter =
      new OfficialT2K4EAttackAdapterV1(
        associations,
      );
    const first = createMessage("first-message");
    const second = createMessage("second-message");
    const resolvers: Array<(value: unknown) => void> = [];
    const rollAttack = vi.fn(() =>
      new Promise((resolve) => {
        resolvers.push(resolve);
      }));
    const item = { id: "weapon", rollAttack };
    const actor = { id: "actor" };

    const firstExecution = adapter.execute({
      plan: createPlan("first-plan"),
      actor,
      item,
    });
    const secondExecution = adapter.execute({
      plan: createPlan("second-plan"),
      actor,
      item,
    });

    resolvers[1]?.(second);
    resolvers[0]?.(first);

    await Promise.all([
      firstExecution,
      secondExecution,
    ]);

    expect(
      associations.getByMessageId("first-message")?.planId,
    ).toBe("first-plan");
    expect(
      associations.getByMessageId("second-message")?.planId,
    ).toBe("second-plan");
  });

  it("rejects actor, item, and token identity mismatches", async () => {
    const adapter = new OfficialT2K4EAttackAdapterV1(
      new ResolutionPlanAssociationStore(),
    );
    const message = createMessage("wrong-token");
    message.rolls[0].options.tokenId = "different";

    await expect(adapter.execute({
      plan: createPlan("identity"),
      actor: { id: "actor" },
      item: {
        id: "weapon",
        rollAttack: vi.fn()
          .mockResolvedValue(message),
      },
    })).rejects.toThrow("unexpected tokenId");

    await expect(adapter.execute({
      plan: createPlan("actor-identity"),
      actor: { id: "different" },
      item: { id: "weapon", rollAttack: vi.fn() },
    })).rejects.toThrow("actor does not match");
  });

  it("migrates correlation to an official push replacement through roll options", async () => {
    const associations =
      new ResolutionPlanAssociationStore();
    const plan = createPlan("push-plan");
    const initial = createMessage("initial-message");
    await new OfficialT2K4EAttackAdapterV1(
      associations,
    ).execute({
      plan,
      actor: { id: "actor" },
      item: {
        id: "weapon",
        rollAttack: vi.fn()
          .mockResolvedValue(initial),
      },
    });

    // Official push duplicates the evaluated roll, deletes the initial
    // message, and creates a replacement from the duplicate. Unknown roll
    // options are preserved by that serialization path.
    const replacement = createMessage("pushed-message");
    replacement.rolls = JSON.parse(
      JSON.stringify(initial.rolls),
    );
    const observer =
      new OfficialAttackCorrelationObserver(
        associations,
      );

    await expect(
      observer.observeCreated(replacement),
    ).resolves.toBe(true);
    expect(
      associations.getByMessageId("pushed-message"),
    ).toBe(plan);
    expect(replacement.update).toHaveBeenCalledWith({
      [`flags.${RESOLUTION_PLAN_FLAG_SCOPE}.${RESOLUTION_PLAN_FLAG_KEY}`]:
        plan,
    });
  });
});
