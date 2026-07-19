import type {
  StagedEndToEndRangedCombatRequest,
  StagedEndToEndRangedCombatResult,
} from "../../combat/staged-end-to-end-ranged-combat-workflow";
import {
  StagedEndToEndRangedCombatWorkflow,
} from "../../combat/staged-end-to-end-ranged-combat-workflow";
import type {
  CombatChatNames,
} from "../../ui/combat-chat-card-view-model-factory";
import {
  CombatChatCardRenderer,
} from "../../ui/combat-chat-card-renderer";
import {
  CombatResultPayloadFactory,
} from "./combat-result-payload-factory";
import {
  FoundryChatMessagePublisher,
} from "./foundry-chat-message-publisher";
import {
  StagedCombatChatViewModelFactory,
} from "./staged-combat-chat-view-model-factory";

export interface StagedFoundryRangedAttackRequest {
  combat:
    StagedEndToEndRangedCombatRequest;

  names:
    CombatChatNames;

  attackerActor?: unknown;
}

export class StagedFoundryRangedAttackService {
  constructor(
    private readonly workflow:
      StagedEndToEndRangedCombatWorkflow,
    private readonly viewModelFactory:
      StagedCombatChatViewModelFactory,
    private readonly renderer:
      CombatChatCardRenderer,
    private readonly payloadFactory:
      CombatResultPayloadFactory,
    private readonly publisher:
      FoundryChatMessagePublisher,
  ) {}

  async execute(
    request:
      StagedFoundryRangedAttackRequest,
  ): Promise<
    StagedEndToEndRangedCombatResult
  > {
    const result =
      await this.workflow.resolve(
        request.combat,
      );

    const model =
      this.viewModelFactory.create(
        result,
        request.names,
      );

    const content =
      this.renderer.render(
        model,
      );

    const payload =
      this.payloadFactory.create(
        result,
      );

    await this.publisher.publish({
      content,
      attackerActor:
        request.attackerActor,
      metadata:
        payload,
    });

    return result;
  }
}
