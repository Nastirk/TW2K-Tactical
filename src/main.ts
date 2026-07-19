import { Logger } from "./core/logger";

Hooks.once("init", () => {
  Logger.info("TW2K Tactical initializing");
});

Hooks.once("ready", () => {
  Logger.info("TW2K Tactical ready");
});
