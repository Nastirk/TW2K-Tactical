import {
  RESOLUTION_PLAN_FLAG_KEY,
  RESOLUTION_PLAN_FLAG_SCOPE,
  RESOLUTION_PLAN_ROLL_OPTION,
  ResolutionPlanAssociationStore,
  assertOfficialRollIdentity,
  isPersistedOfficialAttackMessage,
  type OfficialAttackMessageLike,
} from "./official-attack-association";
import {
  RESOLUTION_PLAN_VERSION,
  collapseEligibleContextualModifiers,
  isResolutionPlanExecutable,
  type ResolutionPlan,
} from "./resolution-plan";

type UnknownRecord = Record<string, unknown>;

export const OFFICIAL_T2K4E_ATTACK_ADAPTER_VERSION = 1 as const;

export interface OfficialT2K4EAttackItemLike {
  id?: string;
  rollAttack?(
    options?: UnknownRecord,
    actor?: unknown,
  ): Promise<unknown>;
}

export interface OfficialT2K4EAttackRequest {
  plan: ResolutionPlan;
  actor: unknown;
  item: OfficialT2K4EAttackItemLike;
}

export interface OfficialT2K4EAttackCommit {
  adapterVersion:
    typeof OFFICIAL_T2K4E_ATTACK_ADAPTER_VERSION;
  plan: ResolutionPlan;
  message: OfficialAttackMessageLike & {
    id: string;
  };
}

export class OfficialT2K4EAttackAdapterV1 {
  readonly adapterVersion =
    OFFICIAL_T2K4E_ATTACK_ADAPTER_VERSION;

  constructor(
    private readonly associations:
      ResolutionPlanAssociationStore,
  ) {}

  async execute(
    request: OfficialT2K4EAttackRequest,
  ): Promise<OfficialT2K4EAttackCommit | undefined> {
    const { plan, actor, item } = request;

    this.validatePlan(plan);

    if (!isResolutionPlanExecutable(plan)) {
      return undefined;
    }

    const actorId = readId(actor);

    if (actorId !== plan.identity.actorId) {
      throw new Error(
        "The selected official T2K4E actor does not match the ResolutionPlan.",
      );
    }

    if (item.id !== plan.identity.itemId) {
      throw new Error(
        "The selected official T2K4E item does not match the ResolutionPlan.",
      );
    }

    if (typeof item.rollAttack !== "function") {
      throw new Error(
        "The selected item does not expose official T2K4E rollAttack().",
      );
    }

    const result = await item.rollAttack(
      {
        modifier:
          plan.netNumericModifier,
      },
      actor,
    );

    if (!isPersistedOfficialAttackMessage(result)) {
      return undefined;
    }

    assertOfficialRollIdentity(result, plan.identity);

    const roll = result.rolls[0];
    roll.options = {
      ...(roll.options ?? {}),
      [RESOLUTION_PLAN_ROLL_OPTION]:
        plan.planId,
    };

    await result.update({
      rolls: [JSON.stringify(roll)],
      [`flags.${RESOLUTION_PLAN_FLAG_SCOPE}.${RESOLUTION_PLAN_FLAG_KEY}`]:
        plan,
    });

    this.associations.associate(
      result.id,
      plan,
    );

    return {
      adapterVersion:
        this.adapterVersion,
      plan,
      message: result,
    };
  }

  private validatePlan(plan: ResolutionPlan): void {
    if (plan.version !== RESOLUTION_PLAN_VERSION) {
      throw new Error(
        `Unsupported ResolutionPlan version '${plan.version}'.`,
      );
    }

    if (!plan.planId) {
      throw new Error(
        "ResolutionPlan planId is required.",
      );
    }

    const collapsed =
      collapseEligibleContextualModifiers(
        plan.contextualModifiers,
      );

    if (collapsed !== plan.netNumericModifier) {
      throw new Error(
        "ResolutionPlan net modifier does not match its eligible contextual modifiers.",
      );
    }
  }
}

function readId(value: unknown): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as UnknownRecord;
  const id = record.id ?? record._id;
  return typeof id === "string" && id.length > 0
    ? id
    : undefined;
}
