import { describe, expect, it, vi } from "vitest";
import {
  FoundryCanvasTargetActorSource,
  FoundryOwnerOrGmCombatActionPermission,
  FoundrySelectionAttackContextSource,
  FoundryWeaponCategoryResolver,
  readFoundryUuid,
} from "../../../src/foundry/runtime/foundry-runtime-adapters";

function createWeapon() {
  return {
    id: "weapon-1",
    name: "Test Rifle",
    type: "weapon",
    system: {
      damage: 2,
      crit: 3,
      armorModifier: 0,
      range: 5,
    },
  };
}

function createContextSource(
  targetActor: unknown,
  placeables: unknown[],
) {
  return new FoundrySelectionAttackContextSource(
    {
      attackerActor: {
        id: "attacker",
      },
      targetActor,
      weapon: createWeapon(),
    },
    () => ({
      tokens: {
        placeables,
      },
      grid: {
        size: 100,
      },
      scene: {
        grid: {
          distance: 10,
        },
      },
    }),
    new FoundryWeaponCategoryResolver(),
  );
}

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

  it("infers common ranged weapon categories including the real T2K4E itemType field", () => {
    const resolver = new FoundryWeaponCategoryResolver();

    expect(resolver.resolve({ name: "M16 Assault Rifle" })).toBe("assault-rifle");
    expect(resolver.resolve({ name: "9mm SMG" })).toBe("smg");
    expect(resolver.resolve({ name: "Service Pistol" })).toBe("pistol");
    expect(
      resolver.resolve({
        name: "Model 12",
        system: {
          itemType: "Shotgun",
        },
      }),
    ).toBe("shotgun");
  });

  it("reads the real T2K4E scope weapon property", () => {
    const resolver = new FoundryWeaponCategoryResolver();

    expect(
      resolver.hasTelescopicSight({
        system: {
          props: {
            scope: true,
          },
        },
      }),
    ).toBe(true);
  });

  it("marks T2K4E shotguns for shotgun range rules", () => {
    const source =
      new FoundrySelectionAttackContextSource(
        {
          attackerActor: {
            id: "attacker",
          },
          targetActor: {
            id: "target",
          },
          weapon: {
            id: "shotgun-1",
            name: "Model 12",
            type: "weapon",
            system: {
              itemType: "Shotgun",
              damage: 3,
              crit: 3,
              armorModifier: 0,
              range: 2,
            },
          },
        },
        () => ({}),
        new FoundryWeaponCategoryResolver(),
      );

    expect(
      source.usesShotgunRangeRules(
        "shotgun-1",
      ),
    ).toBe(true);
  });

  it("detects the real T2K4E prone status", () => {
    const targetActor = {
      id: "target",
      effects: [
        {
          getFlag: (
            scope: string,
            key: string,
          ) =>
            scope === "core" &&
            key === "statusId"
              ? "prone"
              : undefined,
        },
      ],
    };

    const source = createContextSource(
      targetActor,
      [
        {
          actor: {
            id: "attacker",
          },
          document: {
            elevation: 0,
            width: 1,
            height: 1,
          },
        },
        {
          actor: targetActor,
          document: {
            elevation: 0,
            width: 1,
            height: 1,
          },
        },
      ],
    );

    expect(
      source.isTargetProne(
        "target",
      ),
    ).toBe(true);
  });

  it("classifies target size from Foundry token grid dimensions", () => {
    const targetActor = {
      id: "target",
    };

    const small = createContextSource(
      targetActor,
      [
        {
          actor: {
            id: "target",
          },
          document: {
            width: 0.5,
            height: 0.5,
          },
        },
      ],
    );

    const normal = createContextSource(
      targetActor,
      [
        {
          actor: {
            id: "target",
          },
          document: {
            width: 1,
            height: 1,
          },
        },
      ],
    );

    const large = createContextSource(
      targetActor,
      [
        {
          actor: {
            id: "target",
          },
          document: {
            width: 2,
            height: 1,
          },
        },
      ],
    );

    expect(
      small.getTargetSize(
        "target",
      ),
    ).toBe("small");

    expect(
      normal.getTargetSize(
        "target",
      ),
    ).toBe("normal");

    expect(
      large.getTargetSize(
        "target",
      ),
    ).toBe("large");
  });

  it("detects an elevated attacker from Foundry token elevation", () => {
    const targetActor = {
      id: "target",
    };

    const source = createContextSource(
      targetActor,
      [
        {
          actor: {
            id: "attacker",
          },
          document: {
            elevation: 10,
            width: 1,
            height: 1,
          },
        },
        {
          actor: {
            id: "target",
          },
          document: {
            elevation: 0,
            width: 1,
            height: 1,
          },
        },
      ],
    );

    expect(
      source.isAttackerElevated(
        "attacker",
        "target",
      ),
    ).toBe(true);
  });


  it("reads target terrain from a Foundry region flag", () => {
    const targetActor = {
      id: "target",
    };

    const forestRegion = {
      flags: {
        "tw2k-tactical": {
          terrainType:
            "Forest",
        },
      },
    };

    const source = createContextSource(
      targetActor,
      [
        {
          actor: {
            id: "attacker",
          },
          document: {
            actorId: "attacker",
            width: 1,
            height: 1,
          },
        },
        {
          actor: targetActor,
          document: {
            actorId: "target",
            width: 1,
            height: 1,
            regions:
              new Set([
                forestRegion,
              ]),
          },
        },
      ],
    );

    expect(
      source.getTargetTerrain(
        "target",
      ),
    ).toBe("forest");
  });

  it("falls back to a structured token terrain flag", () => {
    const targetActor = {
      id: "target",
    };

    const source = createContextSource(
      targetActor,
      [
        {
          actor: targetActor,
          document: {
            actorId: "target",
            width: 1,
            height: 1,
            flags: {
              "tw2k-tactical": {
                terrainType:
                  "foliage",
              },
            },
          },
        },
      ],
    );

    expect(
      source.getTargetTerrain(
        "target",
      ),
    ).toBe("foliage");
  });

  it("allows a GM to apply a staged result", () => {
    const permission = new FoundryOwnerOrGmCombatActionPermission(() => ({
      user: { isGM: true },
      actors: { get: vi.fn() },
    }));

    expect(permission.canApplyResult("target")).toBe(true);
  });

  it("reads a synthetic actor UUID from the targeted actor", () => {
    expect(
      readFoundryUuid({
        uuid: "Scene.scene-1.Token.token-1.Actor.target",
      }),
    ).toBe(
      "Scene.scene-1.Token.token-1.Actor.target",
    );
  });
});
