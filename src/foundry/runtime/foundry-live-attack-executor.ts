import { ArmorResolver } from "../../combat/armor-resolver";
import { AttackContextBuilder } from "../../combat/attack-context-builder";
import { CriticalInjuryResolver } from "../../combat/critical-injury-resolver";
import { CriticalInjuryRollResolver } from "../../combat/critical-injury-roll-resolver";
import { CriticalInjuryTableResolver } from "../../combat/critical-injury-table-resolver";
import { DamageResolver } from "../../combat/damage-resolver";
import { DeathSaveResolver } from "../../combat/death-save-resolver";
import { HitLocationResolver } from "../../combat/hit-location-resolver";
import { ModifierAwareStagedRangedCombatWorkflow, type ModifierAwareStagedRangedCombatRequest } from "../../combat/modifier-aware-staged-ranged-combat-workflow";
import { PostHitResolver } from "../../combat/post-hit-resolver";
import { DiceModifierApplicator } from "../../dice/modifier-applicator";
import { DiceEngine } from "../../dice/roller";
import { RangedCombatModifierResolver } from "../../rules/ranged-combat-modifier-resolver";
import { ElevationModifierProvider } from "../../rules/providers/elevation-modifier-provider";
import { RangeModifierProvider } from "../../rules/providers/range-modifier-provider";
import { SameHexFirearmModifierProvider } from "../../rules/providers/same-hex-firearm-modifier-provider";
import { TargetProneModifierProvider } from "../../rules/providers/target-prone-modifier-provider";
import { TargetSizeModifierProvider } from "../../rules/providers/target-size-modifier-provider";
import { TerrainModifierProvider } from "../../rules/providers/terrain-modifier-provider";
import { CalledShotModifierProvider } from "../../rules/providers/called-shot-modifier-provider";
import { DefenselessSameHexModifierProvider } from "../../rules/providers/defenseless-same-hex-modifier-provider";
import { HelperModifierProvider } from "../../rules/providers/helper-modifier-provider";
import { MovingVehicleModifierProvider } from "../../rules/providers/moving-vehicle-modifier-provider";
import { SpecialtyModifierProvider } from "../../rules/providers/specialty-modifier-provider";
import { TargetMovementModifierProvider } from "../../rules/providers/target-movement-modifier-provider";
import { CombatChatCardRenderer } from "../../ui/combat-chat-card-renderer";
import { CombatResultPayloadFactory } from "../chat/combat-result-payload-factory";
import { FoundryChatMessagePublisher } from "../chat/foundry-chat-message-publisher";
import type { FoundryChatMessageClassLike } from "../chat/foundry-chat-types";
import { ModifierAwareStagedFoundryRangedAttackService } from "../chat/modifier-aware-staged-foundry-ranged-attack-service";
import { StagedCombatChatViewModelFactory } from "../chat/staged-combat-chat-view-model-factory";
import { FoundryAttackContextDataSource } from "../combat/foundry-attack-context-data-source";
import type {
  FoundryLiveAttackExecutor,
  FoundryLiveAttackSelection,
} from "../combat/foundry-live-attack-types";
import { FoundryDieRoller } from "../dice/foundry-die-roller";
import {
  FoundrySelectionAttackContextSource,
  FoundryWeaponCategoryResolver,
  readFoundryName,
  readFoundryUuid,
} from "./foundry-runtime-adapters";

interface ModifierAwareAttackServiceLike {
  execute(request: {
    attack: ModifierAwareStagedRangedCombatRequest;
    names: {
      attackerName: string;
      targetName: string;
      weaponName: string;
    };
    attackerActor?: unknown;
    targetActorUuid?: string;
  }): Promise<unknown>;
}

export interface FoundryLiveAttackExecutionContext {
  service: ModifierAwareAttackServiceLike;
  sameHex: boolean;
  atShortRange: boolean;
}

export interface FoundryLiveAttackExecutionContextFactory {
  create(selection: FoundryLiveAttackSelection): FoundryLiveAttackExecutionContext;
}

export class DefaultFoundryLiveAttackExecutionContextFactory
  implements FoundryLiveAttackExecutionContextFactory
{
  constructor(
    private readonly getCanvas: () => unknown,
    private readonly ChatMessage: FoundryChatMessageClassLike,
    private readonly categoryResolver: FoundryWeaponCategoryResolver,
  ) {}

  create(selection: FoundryLiveAttackSelection): FoundryLiveAttackExecutionContext {
    const source = new FoundrySelectionAttackContextSource(
      selection,
      this.getCanvas,
      this.categoryResolver,
    );

    const dataSource = new FoundryAttackContextDataSource(source);
    const contextBuilder = new AttackContextBuilder(dataSource);
    const dieRoller = new FoundryDieRoller();

    const postHitResolver = new PostHitResolver(
      new HitLocationResolver({
        rollD6: () => dieRoller.rollDie(6),
      }),
      new DamageResolver(),
      new ArmorResolver(),
      new CriticalInjuryResolver(),
    );

    const criticalInjuryRollResolver = new CriticalInjuryRollResolver(
      {
        rollD10: () => dieRoller.rollDie(10),
      },
      new CriticalInjuryTableResolver(),
    );

    const workflow = new ModifierAwareStagedRangedCombatWorkflow(
      contextBuilder,
      [
        new RangeModifierProvider(),
        new SameHexFirearmModifierProvider(source),
        new DefenselessSameHexModifierProvider(),
        new TargetProneModifierProvider(),
        new TargetSizeModifierProvider(),
        new ElevationModifierProvider(),
        new TerrainModifierProvider(),
        new CalledShotModifierProvider(),
        new TargetMovementModifierProvider(),
        new MovingVehicleModifierProvider(),
        new HelperModifierProvider(),
        new SpecialtyModifierProvider(source),
      ],
      new DiceModifierApplicator(),
      new DiceEngine(dieRoller),
      postHitResolver,
      criticalInjuryRollResolver,
      new DeathSaveResolver(),
      new RangedCombatModifierResolver(),
    );

    const service = new ModifierAwareStagedFoundryRangedAttackService(
      workflow,
      new StagedCombatChatViewModelFactory(),
      new CombatChatCardRenderer(),
      new CombatResultPayloadFactory(),
      new FoundryChatMessagePublisher(this.ChatMessage),
    );

    return {
      service,
      sameHex: source.isSameHex(),
      atShortRange: source.isAtShortRange(),
    };
  }
}

export class FoundryModifierAwareLiveAttackExecutor implements FoundryLiveAttackExecutor {
  constructor(
    private readonly contextFactory: FoundryLiveAttackExecutionContextFactory,
  ) {}

  async execute(request: {
    selection: FoundryLiveAttackSelection;
    dialogInput: Record<string, unknown>;
  }): Promise<void> {
    const attack = request.dialogInput.attack;

    if (!this.isModifierAwareAttackRequest(attack)) {
      throw new Error("The attack dialog did not return a modifier-aware attack request.");
    }

    const context = this.contextFactory.create(request.selection);

    const runtimeAttack: ModifierAwareStagedRangedCombatRequest = {
      ...attack,
      modifiers: {
        ...attack.modifiers,
        sameHex: context.sameHex,
        atShortRange: context.atShortRange,
      },
    };

    await context.service.execute({
      attack: runtimeAttack,
      names: {
        attackerName: readFoundryName(request.selection.attackerActor, "Attacker"),
        targetName: readFoundryName(request.selection.targetActor, "Target"),
        weaponName: readFoundryName(request.selection.weapon, "Weapon"),
      },
      attackerActor: request.selection.attackerActor,
      targetActorUuid:
        readFoundryUuid(
          request.selection.targetActor,
        ),
    });
  }

  private isModifierAwareAttackRequest(
    value: unknown,
  ): value is ModifierAwareStagedRangedCombatRequest {
    if (!value || typeof value !== "object") {
      return false;
    }

    const record = value as Record<string, unknown>;
    return Boolean(record.combat) && Boolean(record.modifiers);
  }
}
