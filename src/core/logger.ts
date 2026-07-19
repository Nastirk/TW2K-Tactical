import { MODULE_ID } from "./constants";

export class Logger {
  static info(message: string): void {
    console.log(`[${MODULE_ID}] ${message}`);
  }

  static warn(message: string): void {
    console.warn(`[${MODULE_ID}] ${message}`);
  }

  static error(message: string): void {
    console.error(`[${MODULE_ID}] ${message}`);
  }
}
