import type {
  ResolutionPlan,
  ResolutionPlanIdentity,
} from "./resolution-plan";

export const RESOLUTION_PLAN_FLAG_SCOPE = "tw2k-tactical";
export const RESOLUTION_PLAN_FLAG_KEY = "resolutionPlan";
export const RESOLUTION_PLAN_ROLL_OPTION =
  "tw2kTacticalResolutionPlanId";

type UnknownRecord = Record<string, unknown>;

export interface OfficialRollLike {
  options?: UnknownRecord;
  toJSON?(): unknown;
  [key: string]: unknown;
}

export interface OfficialAttackMessageLike {
  id?: string;
  documentName?: string;
  rolls?: OfficialRollLike[];
  flags?: UnknownRecord;
  update?(
    changes: UnknownRecord,
  ): Promise<unknown>;
}

export interface OfficialAttackHookBus {
  on(
    hook: string,
    callback: (...args: unknown[]) => unknown,
  ): unknown;
}

export class ResolutionPlanAssociationStore {
  private readonly plans =
    new Map<string, ResolutionPlan>();

  private readonly planIdsByMessage =
    new Map<string, string>();

  register(plan: ResolutionPlan): void {
    const existing = this.plans.get(plan.planId);

    if (existing && existing !== plan) {
      throw new Error(
        `ResolutionPlan id '${plan.planId}' is already registered.`,
      );
    }

    this.plans.set(plan.planId, plan);
  }

  associate(messageId: string, plan: ResolutionPlan): void {
    this.register(plan);
    this.planIdsByMessage.set(messageId, plan.planId);
  }

  getByMessageId(messageId: string): ResolutionPlan | undefined {
    const planId = this.planIdsByMessage.get(messageId);
    return planId ? this.plans.get(planId) : undefined;
  }

  getByPlanId(planId: string): ResolutionPlan | undefined {
    return this.plans.get(planId);
  }

  removeMessage(messageId: string): void {
    this.planIdsByMessage.delete(messageId);
  }
}

export function getOfficialRollIdentity(
  message: OfficialAttackMessageLike,
): ResolutionPlanIdentity | undefined {
  const options = message.rolls?.[0]?.options;

  if (!options) {
    return undefined;
  }

  const actorId = readString(options.actorId);
  const itemId = readString(options.itemId);

  if (!actorId || !itemId) {
    return undefined;
  }

  return {
    actorId,
    itemId,
    ...optionalString("tokenKey", options.tokenKey),
    ...optionalString("sceneId", options.sceneId),
    ...optionalString("tokenId", options.tokenId),
  };
}

export function assertOfficialRollIdentity(
  message: OfficialAttackMessageLike,
  expected: ResolutionPlanIdentity,
): void {
  const actual = getOfficialRollIdentity(message);

  if (!actual) {
    throw new Error(
      "The official T2K4E attack message does not identify its actor and item.",
    );
  }

  for (const key of [
    "actorId",
    "itemId",
    "tokenKey",
    "sceneId",
    "tokenId",
  ] as const) {
    const expectedValue = expected[key];

    if (
      expectedValue !== undefined &&
      actual[key] !== expectedValue
    ) {
      throw new Error(
        `The official T2K4E attack message has unexpected ${key}.`,
      );
    }
  }
}

export function isPersistedOfficialAttackMessage(
  value: unknown,
): value is OfficialAttackMessageLike & {
  id: string;
  rolls: [OfficialRollLike, ...OfficialRollLike[]];
  update(changes: UnknownRecord): Promise<unknown>;
} {
  if (!value || typeof value !== "object") {
    return false;
  }

  const message = value as OfficialAttackMessageLike;
  const constructorDocumentName =
    readString(
      (
        (message as object).constructor as {
          documentName?: unknown;
        }
      )?.documentName,
    );
  const isChatMessage =
    message.documentName === "ChatMessage" ||
    constructorDocumentName === "ChatMessage";

  return isChatMessage &&
    typeof message.id === "string" &&
    message.id.length > 0 &&
    Array.isArray(message.rolls) &&
    message.rolls.length > 0 &&
    typeof message.update === "function";
}

export class OfficialAttackCorrelationObserver {
  constructor(
    private readonly associations:
      ResolutionPlanAssociationStore,
  ) {}

  register(hooks: OfficialAttackHookBus): void {
    hooks.on("createChatMessage", (message) =>
      this.observeCreated(message));
    hooks.on("deleteChatMessage", (message) =>
      this.observeDeleted(message));
  }

  async observeCreated(message: unknown): Promise<boolean> {
    if (!isPersistedOfficialAttackMessage(message)) {
      return false;
    }

    const planId = readString(
      message.rolls[0].options?.[
        RESOLUTION_PLAN_ROLL_OPTION
      ],
    );
    const plan = planId
      ? this.associations.getByPlanId(planId)
      : undefined;

    if (!plan) {
      return false;
    }

    assertOfficialRollIdentity(message, plan.identity);
    this.associations.associate(message.id, plan);

    await message.update({
      [`flags.${RESOLUTION_PLAN_FLAG_SCOPE}.${RESOLUTION_PLAN_FLAG_KEY}`]:
        plan,
    });

    return true;
  }

  observeDeleted(message: unknown): void {
    const messageId = readString(
      (message as OfficialAttackMessageLike | undefined)?.id,
    );

    if (messageId) {
      this.associations.removeMessage(messageId);
    }
  }
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0
    ? value
    : undefined;
}

function optionalString(
  key: "tokenKey" | "sceneId" | "tokenId",
  value: unknown,
): Partial<ResolutionPlanIdentity> {
  const parsed = readString(value);
  return parsed ? { [key]: parsed } : {};
}
