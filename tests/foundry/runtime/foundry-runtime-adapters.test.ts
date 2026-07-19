import { describe, expect, it, vi } from "vitest";
import {
  FoundryCanvasTargetActorSource,
  FoundryOwnerOrGmCombatActionPermission,
  FoundryWeaponCategoryResolver,
} from "../../../src/foundry/runtime/foundry-runtime-adapters";

describe("Foundry runtime adapters", () => {
  it("resolves the single targeted token actor", () => {
    const actor = { id: "target" };
    const source = new FoundryCanvasTargetActorSource(() => ({
      user: {
        targets: new Set([
          { actor },
        ]),
      },
    }));

    expect(source.getTargetActor()).toBe(actor);
  });

  it("rejects ambiguous multi-target attacks", () => {
    const source = new FoundryCanvasTargetActorSource(() => ({
      user: {
        targets: new Set([
          { actor: { id: "target-1" } },
          { actor: { id: "target-2" } },
        ]),
      },
    }));

    expect(source.getTargetActor()).toBeNull();
  });

  it("infers common ranged weapon categories", () => {
    const resolver = new FoundryWeaponCategoryResolver();

    expect(resolver.resolve({ name: "M16 Assault Rifle" })).toBe("assault-rifle");
    expect(resolver.resolve({ name: "9mm SMG" })).toBe("smg");
    expect(resolver.resolve({ name: "Service Pistol" })).toBe("pistol");
  });

  it("allows a GM to apply a staged result", () => {
    const permission = new FoundryOwnerOrGmCombatActionPermission(() => ({
      user: { isGM: true },
      actors: { get: vi.fn() },
    }));

    expect(permission.canApplyResult("target")).toBe(true);
  });
});
