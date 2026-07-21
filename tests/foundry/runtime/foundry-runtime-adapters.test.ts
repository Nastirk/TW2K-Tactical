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

  it("requires an equipped telescopic-sight gear item attached to the selected weapon", () => {
    const resolver = new FoundryWeaponCategoryResolver();
    const weapon = {
      id: "weapon-1",
      type: "weapon",
      system: {
        props: {
          scope: true,
        },
      },
    };

    expect(
      resolver.hasTelescopicSight(
        weapon,
        {
          items: [
            {
              type: "gear",
              name: "Telescopic Sight (Scope)",
              system: {
                equipped: true,
                backpack: false,
              },
              flags: {
                "tw2k-tactical": {
                  attachedWeaponId: "weapon-1",
                },
              },
            },
          ],
        },
      ),
    ).toBe(true);

    expect(
      resolver.hasTelescopicSight(
        weapon,
        {
          items: [
            {
              type: "gear",
              name: "Telescopic Sight (Scope)",
              system: {
                equipped: false,
                backpack: false,
              },
              flags: {
                "tw2k-tactical": {
                  attachedWeaponId: "weapon-1",
                },
              },
            },
          ],
        },
      ),
    ).toBe(false);

    expect(
      resolver.hasTelescopicSight(
        weapon,
        {
          items: [
            {
              type: "gear",
              name: "Telescopic Sight (Scope)",
              system: {
                equipped: true,
                backpack: false,
              },
              flags: {
                "tw2k-tactical": {
                  attachedWeaponId: "weapon-2",
                },
              },
            },
          ],
        },
      ),
    ).toBe(false);

    expect(
      resolver.hasTelescopicSight(
        {
          ...weapon,
          system: {
            props: {
              scope: false,
            },
          },
        },
        {
          items: [
            {
              type: "gear",
              name: "Telescopic Sight (Scope)",
              system: {
                equipped: true,
                backpack: false,
              },
              flags: {
                "tw2k-tactical": {
                  attachedWeaponId: "weapon-1",
                },
              },
            },
          ],
        },
      ),
    ).toBe(true);
  });

  it("requires an equipped bipod gear item attached to the selected weapon", () => {
    const resolver = new FoundryWeaponCategoryResolver();

    expect(
      resolver.hasBipod(
        {
          id: "weapon-1",
          type: "weapon",
          system: {
            props: {
              bipod: false,
            },
          },
        },
        {
          items: [
            {
              type: "gear",
              name: "Bipod",
              system: {
                equipped: true,
                backpack: false,
              },
              flags: {
                "tw2k-tactical": {
                  attachedWeaponId: "weapon-1",
                },
              },
            },
          ],
        },
      ),
    ).toBe(true);
  });


  it("requires an equipped tripod gear item attached to the selected weapon", () => {
    const resolver = new FoundryWeaponCategoryResolver();

    expect(
      resolver.hasTripod(
        {
          id: "weapon-1",
          type: "weapon",
          system: {
            props: {
              tripod: false,
            },
          },
        },
        {
          items: [
            {
              type: "gear",
              name: "Tripod",
              system: {
                equipped: true,
                backpack: false,
              },
              flags: {
                "tw2k-tactical": {
                  attachedWeaponId: "weapon-1",
                },
              },
            },
          ],
        },
      ),
    ).toBe(true);
  });

  it("reads the T2K4E mounted weapon state", () => {
    const resolver = new FoundryWeaponCategoryResolver();

    expect(
      resolver.isVehicleMounted({
        type: "weapon",
        system: {
          props: {
            mounted: true,
          },
        },
      }),
    ).toBe(true);

    expect(
      resolver.isVehicleMounted({
        type: "weapon",
        system: {
          props: {
            mounted: false,
          },
        },
      }),
    ).toBe(false);
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

  it("detects a prone attacker for stable-platform context", () => {
    const attackerActor = {
      id: "attacker",
      statuses: new Set(["prone"]),
    };
    const targetActor = { id: "target" };

    const source = new FoundrySelectionAttackContextSource(
      {
        attackerActor,
        targetActor,
        weapon: createWeapon(),
      },
      () => ({
        tokens: {
          placeables: [
            { actor: attackerActor },
            { actor: targetActor },
          ],
        },
      }),
      new FoundryWeaponCategoryResolver(),
    );

    expect(
      source.isAttackerProne(
        "attacker",
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


  it("treats offset tokens inside the same Foundry hex as same-hex combat", () => {
    const attackerActor = { id: "attacker" };
    const targetActor = { id: "target" };

    const source = new FoundrySelectionAttackContextSource(
      {
        attackerActor,
        targetActor,
        weapon: createWeapon(),
      },
      () => ({
        tokens: {
          placeables: [
            { actor: attackerActor, center: { x: 110, y: 110 } },
            { actor: targetActor, center: { x: 175, y: 145 } },
          ],
        },
        grid: {
          size: 100,
          pointToCube: () => ({ q: 3, r: 4, s: -7 }),
          measurePath: () => ({ distance: 10, spaces: 1 }),
        },
        scene: { grid: { distance: 10 } },
      }),
      new FoundryWeaponCategoryResolver(),
    );

    expect(source.getTokenDistanceHexes("attacker", "target")).toBe(0);
    expect(source.isSameHex()).toBe(true);
  });

  it("converts four 2m Foundry steps into same-hex T2K combat", () => {
    const attackerActor = { id: "attacker" };
    const targetActor = { id: "target" };

    const source = new FoundrySelectionAttackContextSource(
      {
        attackerActor,
        targetActor,
        weapon: createWeapon(),
      },
      () => ({
        tokens: {
          placeables: [
            { actor: attackerActor, center: { x: 100, y: 100 } },
            { actor: targetActor, center: { x: 200, y: 100 } },
          ],
        },
        grid: {
          size: 100,
          measurePath: () => ({ distance: 8, spaces: 4 }),
        },
        scene: { grid: { distance: 2 } },
      }),
      new FoundryWeaponCategoryResolver(),
    );

    expect(source.getTokenDistanceHexes("attacker", "target")).toBe(0);
    expect(source.isSameHex()).toBe(true);
    expect(source.getCombatGridEvidence("attacker", "target")).toMatchObject({
      foundryMetersPerGridSpace: 2,
      foundryGridSteps: 4,
      foundryDistanceMeters: 8,
      t2kMetersPerCombatHex: 10,
      foundrySpacesPerT2KHex: 5,
      measurementSource: "foundry-path",
    });
  });

  it("converts five 2m Foundry steps into one T2K combat hex", () => {
    const attackerActor = { id: "attacker" };
    const targetActor = { id: "target" };

    const source = new FoundrySelectionAttackContextSource(
      {
        attackerActor,
        targetActor,
        weapon: createWeapon(),
      },
      () => ({
        tokens: {
          placeables: [
            { actor: attackerActor, center: { x: 100, y: 100 } },
            { actor: targetActor, center: { x: 200, y: 100 } },
          ],
        },
        grid: {
          size: 100,
          measurePath: () => ({ distance: 10, spaces: 5 }),
        },
        scene: { grid: { distance: 2 } },
      }),
      new FoundryWeaponCategoryResolver(),
    );

    expect(source.getTokenDistanceHexes("attacker", "target")).toBe(1);
    expect(source.isSameHex()).toBe(false);
  });

  it("detects automatic cover, defenseless, movement, specialty, and environment facts", () => {
    const attackerActor = {
      id: "attacker",
      items: [
        {
          type: "specialty",
          name: "Machinegunner",
        },
        {
          type: "gear",
          name: "Night Vision Goggles",
          system: {
            equipped: true,
            backpack: false,
          },
        },
        {
          type: "gear",
          name: "Thermal Optics",
          system: {
            equipped: true,
            backpack: false,
          },
        },
      ],
      flags: {
        "tw2k-tactical": {
          firingFromMovingVehicle: true,
          helperCount: 2,
        },
      },
    };
    const targetActor = {
      id: "target",
      statuses: new Set(["fullCover"]),
      system: {
        health: {
          value: 0,
        },
      },
      flags: {
        "tw2k-tactical": {
          movedSincePreviousTurn: true,
          coverEffectiveAgainstAttacker: true,
          coverArmorLevel: 3,
        },
      },
    };

    const source = new FoundrySelectionAttackContextSource(
      {
        attackerActor,
        targetActor,
        weapon: createWeapon(),
      },
      () => ({
        tokens: {
          placeables: [
            {
              actor: attackerActor,
              center: { x: 0, y: 0 },
              document: { actorId: "attacker", width: 1, height: 1 },
            },
            {
              actor: targetActor,
              center: { x: 200, y: 0 },
              document: { actorId: "target", width: 1, height: 1 },
            },
          ],
        },
        grid: { size: 100 },
        scene: {
          grid: { distance: 10 },
          flags: {
            "tw2k-tactical": {
              lightLevel: "dark",
              weatherModifier: -1,
              visibilityLimitHexes: 10,
            },
          },
        },
      }),
      new FoundryWeaponCategoryResolver(),
    );

    expect(source.isTargetDefenseless("target")).toBe(true);
    expect(source.isTargetInFullCover("target")).toBe(true);
    expect(source.isCoverEffectiveAgainstAttacker("attacker", "target")).toBe(true);
    expect(source.getTargetCoverArmorLevel("target")).toBe(3);
    expect(source.didTargetMove("target")).toBe(true);
    expect(source.isFiringFromMovingVehicle("attacker")).toBe(true);
    expect(source.getLightLevel("attacker", "target")).toBe("dark");
    expect(source.getWeatherModifier()).toBe(-1);
    expect(source.getVisibilityLimitHexes()).toBe(10);
    expect(source.hasNightVision("attacker", 2)).toBe(true);
    expect(source.hasThermalOptics("attacker")).toBe(true);
    expect(source.getHelperCount("attacker")).toBe(2);
    expect(source.hasAttackerSpecialty("attacker", "Machinegunner")).toBe(true);
  });

  it("distinguishes specialty-relevant weapon categories", () => {
    const resolver = new FoundryWeaponCategoryResolver();
    expect(resolver.resolve({ system: { itemType: "Sniper Rifle" } })).toBe("sniper-rifle");
    expect(resolver.resolve({ system: { itemType: "Hunting Rifle" } })).toBe("hunting-rifle");
    expect(resolver.resolve({ system: { itemType: "Grenade Launcher" } })).toBe("grenade-launcher");
    expect(resolver.resolve({ system: { itemType: "Mortar" } })).toBe("mortar");
  });

});
