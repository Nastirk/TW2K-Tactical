import type {
  CombatChatNames,
} from "../../ui/combat-chat-card-view-model-factory";
import {
  CombatChatCardRenderer,
} from "../../ui/combat-chat-card-renderer";
import {
  ModifierAwareStagedRangedCombatWorkflow,
  type ModifierAwareStagedRangedCombatRequest,
  type ModifierAwareStagedRangedCombatResult,
} from "../../combat/modifier-aware-staged-ranged-combat-workflow";
import {
  CombatResultPayloadFactory,
} from "./combat-result-payload-factory";
import {
  FoundryChatMessagePublisher,
} from "./foundry-chat-message-publisher";
import {
  StagedCombatChatViewModelFactory,
} from "./staged-combat-chat-view-model-factory";
import type {
  FoundryAmmoConsumptionService,
} from "../item/foundry-ammo-consumption-service";

export interface ModifierAwareStagedFoundryAttackRequest {
  attack:
    ModifierAwareStagedRangedCombatRequest;

  names:
    CombatChatNames;

  attackerActor?: unknown;

  targetActorUuid?: string;
}

export class ModifierAwareStagedFoundryRangedAttackService {
  constructor(
    private readonly workflow:
      ModifierAwareStagedRangedCombatWorkflow,
    private readonly viewModelFactory:
      StagedCombatChatViewModelFactory,
    private readonly renderer:
      CombatChatCardRenderer,
    private readonly payloadFactory:
      CombatResultPayloadFactory,
    private readonly publisher:
      FoundryChatMessagePublisher,
    private readonly ammoConsumptionService?:
      FoundryAmmoConsumptionService,
  ) {}

  async execute(
    request:
      ModifierAwareStagedFoundryAttackRequest,
  ): Promise<
    ModifierAwareStagedRangedCombatResult
  > {
    const result =
      await this.workflow.resolve(
        request.attack,
      );

    if (result.combat.ammunition) {
      if (!this.ammoConsumptionService) {
        throw new Error(
          "Tracked ammunition cannot be persisted because the runtime ammo service is unavailable.",
        );
      }

      // Commit ammunition before publishing the success card. This prevents
      // a stale or failed update from leaving a misleading chat result.
      await this.ammoConsumptionService
        .consume(
          request.attackerActor,
          result.combat.ammunition,
        );
    }

    const model =
      this.viewModelFactory.create(
        result.combat,
        request.names,
      );

    const content =
      this.renderer.render(
        model,
      );

    const payload =
      this.payloadFactory.create(
        result.combat,
        request.targetActorUuid,
      );

    await this.publisher.publish({
      content,
      attackerActor:
        request.attackerActor,
      metadata: payload,
    });

    return result;
  }
}
