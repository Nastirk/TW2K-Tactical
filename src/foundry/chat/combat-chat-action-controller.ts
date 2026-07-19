import type {
  CombatActionPermission,
} from "./combat-action-permission";
import type {
  CombatActionIdempotency,
} from "./combat-action-idempotency";
import {
  CombatResultApplicationService,
} from "./combat-result-application-service";
import {
  isCombatResultPayload,
  type CombatResultPayload,
} from "./combat-result-payload";

export interface CombatChatMessageLike {
  id: string;
  flags?: Record<
    string,
    unknown
  >;

  update?(
    changes:
      Record<string, unknown>,
  ): Promise<unknown>;
}

export interface ApplyCombatResultRequest {
  message:
    CombatChatMessageLike;
}

export class CombatChatActionController {
  constructor(
    private readonly applicationService:
      CombatResultApplicationService,
    private readonly permission:
      CombatActionPermission,
    private readonly idempotency:
      CombatActionIdempotency,
  ) {}

  async applyResult(
    request:
      ApplyCombatResultRequest,
  ): Promise<void> {
    const {
      message,
    } = request;

    if (
      this.idempotency.hasApplied(
        message.id,
      )
    ) {
      throw new Error(
        "Combat result has already been applied.",
      );
    }

    const payload =
      this.readPayload(
        message,
      );

    const allowed =
      await this.permission
        .canApplyResult(
          payload.targetActorId,
        );

    if (!allowed) {
      throw new Error(
        "You do not have permission to apply this combat result.",
      );
    }

    await this.applicationService
      .apply(payload);

    this.idempotency
      .markApplied(
        message.id,
      );

    await message.update?.({
      "flags.tw2k-tactical.applied":
        true,
    });
  }

  private readPayload(
    message:
      CombatChatMessageLike,
  ): CombatResultPayload {
    const moduleFlags =
      message.flags?.[
        "tw2k-tactical"
      ];

    if (
      !moduleFlags ||
      typeof moduleFlags !==
        "object"
    ) {
      throw new Error(
        "Combat result payload is missing from the chat message.",
      );
    }

    const payload =
      (
        moduleFlags as Record<
          string,
          unknown
        >
      ).combatResult;

    if (
      !isCombatResultPayload(
        payload,
      )
    ) {
      throw new Error(
        "Combat result payload is invalid.",
      );
    }

    return payload;
  }
}
