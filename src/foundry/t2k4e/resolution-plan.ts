export const RESOLUTION_PLAN_VERSION = 1 as const;

export type ResolutionPlanProvenance =
  | "automatic"
  | "manual"
  | "referee"
  | "official-system";

export interface ResolutionPlanEvidence {
  key: string;
  label: string;
  value: string | number | boolean;
  provenance: ResolutionPlanProvenance;
}

export interface ResolutionPlanModifier {
  id: string;
  label: string;
  value: number;
  eligibleForOfficialModifier: boolean;
  provenance: ResolutionPlanProvenance;
  evidence?: ResolutionPlanEvidence[];
}

export interface ResolutionPlanBlocker {
  code: string;
  message: string;
  kind: "hard" | "referee-decision";
}

export type ResolutionPlanRefereeDecision =
  | "not-required"
  | "pending"
  | "approved"
  | "rejected";

export interface ResolutionPlanIdentity {
  actorId: string;
  itemId: string;
  tokenKey?: string;
  sceneId?: string;
  tokenId?: string;
}

export interface ResolutionPlan {
  planId: string;
  version: typeof RESOLUTION_PLAN_VERSION;
  identity: ResolutionPlanIdentity;
  contextualModifiers: ResolutionPlanModifier[];
  netNumericModifier: number;
  evidence: ResolutionPlanEvidence[];
  blockers: ResolutionPlanBlocker[];
  refereeDecision: ResolutionPlanRefereeDecision;
}

export interface ResolutionPlanInput {
  identity: ResolutionPlanIdentity;
  contextualModifiers?: ResolutionPlanModifier[];
  evidence?: ResolutionPlanEvidence[];
  blockers?: ResolutionPlanBlocker[];
  refereeDecision?: ResolutionPlanRefereeDecision;
}

export interface ResolutionPlanIdSource {
  create(): string;
}

export class BrowserResolutionPlanIdSource
  implements ResolutionPlanIdSource
{
  create(): string {
    const value = globalThis.crypto?.randomUUID?.();

    if (!value) {
      throw new Error(
        "The runtime cannot generate a unique ResolutionPlan identifier.",
      );
    }

    return value;
  }
}

export function collapseEligibleContextualModifiers(
  modifiers: readonly ResolutionPlanModifier[],
): number {
  return modifiers.reduce(
    (total, modifier) =>
      modifier.eligibleForOfficialModifier
        ? total + modifier.value
        : total,
    0,
  );
}

export function isResolutionPlanExecutable(
  plan: ResolutionPlan,
): boolean {
  if (plan.refereeDecision === "rejected") {
    return false;
  }

  if (plan.blockers.some((blocker) => blocker.kind === "hard")) {
    return false;
  }

  const needsReferee = plan.blockers.some(
    (blocker) => blocker.kind === "referee-decision",
  );

  if (needsReferee) {
    return plan.refereeDecision === "approved";
  }

  return plan.refereeDecision !== "pending";
}

export class ResolutionPlanFactory {
  constructor(
    private readonly ids: ResolutionPlanIdSource =
      new BrowserResolutionPlanIdSource(),
  ) {}

  create(input: ResolutionPlanInput): ResolutionPlan {
    const contextualModifiers = [
      ...(input.contextualModifiers ?? []),
    ];

    return {
      planId: this.ids.create(),
      version: RESOLUTION_PLAN_VERSION,
      identity: { ...input.identity },
      contextualModifiers,
      netNumericModifier:
        collapseEligibleContextualModifiers(contextualModifiers),
      evidence: [...(input.evidence ?? [])],
      blockers: [...(input.blockers ?? [])],
      refereeDecision:
        input.refereeDecision ?? "not-required",
    };
  }
}
