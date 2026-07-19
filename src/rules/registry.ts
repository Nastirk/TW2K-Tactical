import type { ModifierProvider } from "./provider";

export class ModifierRegistry {
  private readonly providers: ModifierProvider[] = [];

  register(provider: ModifierProvider): void {
    this.providers.push(provider);
  }

  getProviders(): ModifierProvider[] {
    return [...this.providers];
  }
}
