import type {
  ActorCombatState,
} from "../../combat/actor-combat-state";
import type {
  EndToEndRangedCombatResult,
} from "../../combat/end-to-end-ranged-combat-workflow";
import {
  CombatChatCardRenderer,
} from "../../ui/combat-chat-card-renderer";
import {
  CombatChatCardViewModelFactory,
  type CombatChatNames,
} from "../../ui/combat-chat-card-view-model-factory";
import {
  FoundryChatMessagePublisher,
} from "./foundry-chat-message-publisher";

export interface PublishCombatResultRequest {
  result:
    EndToEndRangedCombatResult;

  names:
    CombatChatNames;

  targetActorId?: string;

  targetState?:
    ActorCombatState;

  attackerActor?: unknown;
}

export class CombatChatService {
  constructor(
    private readonly viewModelFactory:
      CombatChatCardViewModelFactory,
    private readonly renderer:
      CombatChatCardRenderer,
    private readonly publisher:
      FoundryChatMessagePublisher,
  ) {}

  async publish(
    request:
      PublishCombatResultRequest,
  ): Promise<void> {
    const model =
      this.viewModelFactory.create(
        request.result,
        request.names,
        request.targetActorId,
        request.targetState,
      );

    const content =
      this.renderer.render(model);

    await this.publisher.publish({
      content,
      attackerActor:
        request.attackerActor,
      metadata: {
        hit:
          request.result.hit,
        successes:
          request.result
            .attack
            .roll
            .successes,
        finalDamage:
          request.result
            .postHit
            ?.finalDamage ??
          0,
        targetActorId:
          request.targetActorId,
      },
    });
  }
}
