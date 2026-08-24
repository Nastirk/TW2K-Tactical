import { Logger } from "./core/logger";
import {
  bootstrapFoundryRuntime,
  type FoundryRuntimeHandle,
  type FoundryRuntimeHookBus,
} from "./foundry/runtime/foundry-runtime-bootstrap";
import type { ChatLogElementLike } from "./foundry/chat/combat-chat-action-listener";
import type { FoundryChatMessageClassLike } from "./foundry/chat/foundry-chat-types";
import type { FoundryDialogClassLike } from "./foundry/dialog/foundry-dialog-types";
import { FoundryTravelMapController } from "./foundry/maps/foundry-travel-map-controller";

type FoundryGlobalScope = typeof globalThis & {
  Dialog?: FoundryDialogClassLike;
  ChatMessage?: FoundryChatMessageClassLike;
  game?: unknown;
  canvas?: unknown;
  ui?: unknown;
};

let runtime: FoundryRuntimeHandle | undefined;

Hooks.once("init", () => {
  Logger.info("TW2K Tactical initializing");

  const globals = globalThis as FoundryGlobalScope;

  if (!globals.Dialog || !globals.ChatMessage) {
    Logger.error("Foundry Dialog or ChatMessage globals are unavailable.");
    return;
  }

  try {
    new FoundryTravelMapController({
      getCanvas: () => globals.canvas,
      getGame: () => globals.game,
      getUi: () => globals.ui,
    }).register(Hooks);

    runtime = bootstrapFoundryRuntime({
      hooks: Hooks as unknown as FoundryRuntimeHookBus,
      Dialog: globals.Dialog,
      ChatMessage: globals.ChatMessage,
      getGame: () => globals.game,
      getCanvas: () => globals.canvas,
      getUi: () => globals.ui,
      getChatRoot: () => (
        typeof document !== "undefined"
          ? document as unknown as ChatLogElementLike
          : null
      ),
    });

    Logger.info("TW2K Tactical runtime hooks registered");
  } catch (error) {
    Logger.error(
      error instanceof Error
        ? `Runtime bootstrap failed: ${error.message}`
        : "Runtime bootstrap failed.",
    );
  }
});

Hooks.once("ready", () => {
  try {
    runtime?.registerReady();

    const report = runtime?.diagnostics();

    if (report) {
      const system = report.systemId ?? "unknown";
      const systemVersion = report.systemVersion ?? "unknown";
      const foundryVersion = report.foundryVersion ?? "unknown";

      Logger.info(
        `Compatibility: system=${system} ${systemVersion}, Foundry=${foundryVersion}`,
      );

      for (const issue of report.issues) {
        Logger.error(`Compatibility issue: ${issue}`);
      }

      for (const warning of report.warnings) {
        Logger.warn(`Compatibility warning: ${warning}`);
      }
    }

    Logger.info("TW2K Tactical ready");
  } catch (error) {
    Logger.error(
      error instanceof Error
        ? `Ready wiring failed: ${error.message}`
        : "Ready wiring failed.",
    );
  }
});
