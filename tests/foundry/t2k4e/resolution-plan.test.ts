import {
  describe,
  expect,
  it,
} from "vitest";
import {
  ResolutionPlanFactory,
  isResolutionPlanExecutable,
} from "../../../src/foundry/t2k4e/resolution-plan";

describe("ResolutionPlan", () => {
  it("generates a versioned plan and collapses only eligible modifiers", () => {
    const plan = new ResolutionPlanFactory({
      create: () => "plan-1",
    }).create({
      identity: {
        actorId: "actor",
        itemId: "weapon",
      },
      contextualModifiers: [
        {
          id: "range",
          label: "Long range",
          value: -2,
          eligibleForOfficialModifier: true,
          provenance: "automatic",
        },
        {
          id: "ammo-policy",
          label: "Ammo policy",
          value: 4,
          eligibleForOfficialModifier: false,
          provenance: "referee",
        },
      ],
    });

    expect(plan).toMatchObject({
      planId: "plan-1",
      version: 1,
      netNumericModifier: -2,
      refereeDecision: "not-required",
    });
    expect(isResolutionPlanExecutable(plan)).toBe(true);
  });

  it("requires referee approval for referee-decision blockers", () => {
    const factory = new ResolutionPlanFactory({
      create: () => "plan-2",
    });
    const pending = factory.create({
      identity: {
        actorId: "actor",
        itemId: "weapon",
      },
      blockers: [{
        code: "ambiguous-cover",
        message: "Referee must decide cover.",
        kind: "referee-decision",
      }],
      refereeDecision: "pending",
    });

    expect(isResolutionPlanExecutable(pending)).toBe(false);
    expect(isResolutionPlanExecutable({
      ...pending,
      refereeDecision: "approved",
    })).toBe(true);
  });
});
