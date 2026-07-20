import { ActorStateService } from "../../combat/actor-state-service";
import { AttackDialogParser } from "../../ui/attack-dialog-parser";
import { AttackDialogRenderer } from "../../ui/attack-dialog-renderer";
import { AttackDialogRequestFactory } from "../../ui/attack-dialog-request-factory";
import { AttackDialogValidator } from "../../ui/attack-dialog-validator";
import { FoundryActorCombatStateRepository } from "../actor/foundry-actor-combat-state-repository";
import type { FoundryGameLike } from "../actor/foundry-actor-types";
import { CombatChatActionController } from "../chat/combat-chat-action-controller";
import { CombatChatActionListener, type ChatLogElementLike } from "../chat/combat-chat-action-listener";
import { InMemoryCombatActionIdempotency } from "../chat/combat-action-idempotency";
import { CombatResultApplicationService } from "../chat/combat-result-application-service";
import { FoundryCombatMessageResolver, type FoundryMessagesLike } from "../chat/foundry-combat-message-resolver";
import type { FoundryChatMessageClassLike } from "../chat/foundry-chat-types";
import { FoundryLiveAttackController } from "../combat/foundry-live-attack-controller";
import { registerFoundryLiveAttackHook, type FoundryHookBus } from "../combat/foundry-live-attack-hook";
import { FoundryAttackDialogService } from "../dialog/foundry-attack-dialog-service";
import type { FoundryDialogClassLike } from "../dialog/foundry-dialog-types";
import { FoundryDieRoller } from "../dice/foundry-die-roller";
import { FoundryWeaponAttackAction } from "../item/foundry-weapon-attack-action";
import { FoundryWeaponAttackSelectionSource } from "../item/foundry-weapon-attack-selection-source";
import { FoundryJQueryWeaponSheetAdapter } from "../item/foundry-weapon-sheet-adapter";
import { registerFoundryWeaponSheetAttackHook, type FoundryItemSheetHookBus } from "../item/foundry-weapon-sheet-attack-hook";
import {
  registerFoundryWeaponAccessoryAttachmentHook,
  type FoundryWeaponAccessoryHookBus,
} from "../item/foundry-weapon-accessory-attachment-hook";
import { T2K4ECombatRequestFactory } from "../t2k4e/t2k4e-combat-request-factory";
import { FoundryAttackDialogInitialFactory } from "./foundry-attack-dialog-initial-factory";
import {
  FoundryCanvasTargetActorSource,
  FoundryOwnerOrGmCombatActionPermission,
  FoundryUiNotificationSink,
  FoundryWeaponCategoryResolver,
} from "./foundry-runtime-adapters";
import { FoundryLiveAttackDialogCollector } from "./foundry-live-attack-dialog-collector";
import { FoundryRandomHitLocationResolver } from "./foundry-random-hit-location-resolver";
import {
  DefaultFoundryLiveAttackExecutionContextFactory,
  FoundryModifierAwareLiveAttackExecutor,
} from "./foundry-live-attack-executor";
import {
  FoundryT2K4ECompatibilityService,
  type FoundryT2K4ECompatibilityReport,
} from "./foundry-t2k4e-compatibility";

type UnknownRecord = Record<string, unknown>;

export interface FoundryRuntimeHookBus {
  on(
    hook: string,
    callback: (...args: unknown[]) => unknown,
  ): unknown;
}

export interface FoundryRuntimeEnvironment {
  hooks: FoundryRuntimeHookBus;
  Dialog: FoundryDialogClassLike;
  ChatMessage: FoundryChatMessageClassLike;
  getGame(): unknown;
  getCanvas(): unknown;
  getUi(): unknown;
  getChatRoot(): ChatLogElementLike | null;
}

export interface FoundryRuntimeHandle {
  attack(): Promise<boolean>;
  diagnostics(): FoundryT2K4ECompatibilityReport;
  registerReady(): void;
}

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object"
    ? value as UnknownRecord
    : null;
}

function installModuleApi(
  game: unknown,
  api: {
    attack: () => Promise<boolean>;
    diagnostics: () => FoundryT2K4ECompatibilityReport;
  },
): void {
  const modules = asRecord(game)?.modules;
  const getModule = asRecord(modules)?.get;

  if (typeof getModule !== "function") {
    return;
  }

  const module = getModule.call(modules, "tw2k-tactical");
  const moduleRecord = asRecord(module);

  if (!moduleRecord) {
    return;
  }

  moduleRecord.api = api;
}

export function bootstrapFoundryRuntime(
  environment: FoundryRuntimeEnvironment,
): FoundryRuntimeHandle {
  const categoryResolver = new FoundryWeaponCategoryResolver();
  const notifications = new FoundryUiNotificationSink(environment.getUi);
  const compatibility = new FoundryT2K4ECompatibilityService(
    environment.getGame,
    environment.getCanvas,
  );

  const selectionSource = new FoundryWeaponAttackSelectionSource(
    new FoundryCanvasTargetActorSource(environment.getGame),
  );

  const dialogService = new FoundryAttackDialogService(
    environment.Dialog,
    new AttackDialogRenderer(),
    new AttackDialogParser(),
    new AttackDialogValidator(),
    new AttackDialogRequestFactory(),
  );

  const dialogCollector = new FoundryLiveAttackDialogCollector(
    dialogService,
    new T2K4ECombatRequestFactory(),
    new FoundryAttackDialogInitialFactory(
      environment.getCanvas,
      categoryResolver,
    ),
    compatibility,
    new FoundryRandomHitLocationResolver(
      new FoundryDieRoller(),
    ),
  );

  const executor = new FoundryModifierAwareLiveAttackExecutor(
    new DefaultFoundryLiveAttackExecutionContextFactory(
      environment.getCanvas,
      environment.ChatMessage,
      categoryResolver,
    ),
  );

  const controller = new FoundryLiveAttackController(
    selectionSource,
    dialogCollector,
    executor,
    notifications,
  );

  const weaponAttackAction = new FoundryWeaponAttackAction(
    selectionSource,
    controller,
  );

  registerFoundryLiveAttackHook(
    environment.hooks as FoundryHookBus,
    controller,
  );

  registerFoundryWeaponSheetAttackHook(
    environment.hooks as FoundryItemSheetHookBus,
    new FoundryJQueryWeaponSheetAdapter(),
    weaponAttackAction,
  );

  registerFoundryWeaponAccessoryAttachmentHook(
    environment.hooks as FoundryWeaponAccessoryHookBus,
  );

  let readyRegistered = false;

  const handle: FoundryRuntimeHandle = {
    attack: () => controller.attack(),
    diagnostics: () => compatibility.inspect(),
    registerReady: () => {
      if (readyRegistered) {
        return;
      }

      const chatRoot = environment.getChatRoot();
      const game = environment.getGame();
      const gameRecord = asRecord(game);
      const messages = gameRecord?.messages;

      if (!chatRoot || !messages) {
        return;
      }

      const actorRepository = new FoundryActorCombatStateRepository(
        game as FoundryGameLike,
      );

      const actionController = new CombatChatActionController(
        new CombatResultApplicationService(
          new ActorStateService(actorRepository),
        ),
        new FoundryOwnerOrGmCombatActionPermission(
          environment.getGame,
        ),
        new InMemoryCombatActionIdempotency(),
      );

      const listener = new CombatChatActionListener(
        actionController,
        new FoundryCombatMessageResolver(
          messages as FoundryMessagesLike,
        ),
        notifications,
      );

      listener.register(chatRoot);
      readyRegistered = true;
    },
  };

  installModuleApi(
    environment.getGame(),
    {
      attack: handle.attack,
      diagnostics: handle.diagnostics,
    },
  );

  return handle;
}
