import { describe, expect, it } from "vitest";
import { FoundryAttackDialogInitialFactory } from "../../../src/foundry/runtime/foundry-attack-dialog-initial-factory";
import { FoundryWeaponCategoryResolver } from "../../../src/foundry/runtime/foundry-runtime-adapters";

function createWeapon() {
  return {
    id: "w",
    type: "weapon",
    name: "Service Pistol",
    system: {
      damage: 2,
      crit: 3,
      armorModifier: 0,
      range: 2,
    },
  };
}

describe("FoundryAttackDialogInitialFactory", () => {
  it("creates safe defaults and infers the weapon category", () => {
    const factory = new FoundryAttackDialogInitialFactory(
      () => undefined,
      new FoundryWeaponCategoryResolver(),
    );

    const result = factory.create({
      attackerActor: { id: "a" },
      targetActor: { id: "t" },
      weapon: createWeapon(),
    });

    expect(result.weaponCategory).toBe("pistol");
    expect(result.aimMode).toBe("quick");
    expect(result.targetTerrainModifier).toBe(0);
    expect(result.weatherModifier).toBe(0);
    expect(result.targetProne).toBe(false);
    expect(result.targetSize).toBe("normal");
    expect(result.elevatedPosition).toBe(false);
    expect(result.hasBipod).toBe(false);
    expect(result.bipodDeployed).toBe(false);
    expect(result.hasTripod).toBe(false);
    expect(result.tripodDeployed).toBe(false);
    expect(result.vehicleMounted).toBe(false);
    expect(result.stablePlatform).toBe(false);
  });

  it("pre-fills automatic prone, target-size, elevation, and terrain facts", () => {
    const attackerActor = {
      id: "a",
    };
    const targetActor = {
      id: "t",
      statuses: new Set([
        "prone",
      ]),
    };

    const canvas = {
      grid: {
        size: 100,
      },
      tokens: {
        placeables: [
          {
            actor: attackerActor,
            center: {
              x: 0,
              y: 0,
            },
            document: {
              actorId: "a",
              width: 1,
              height: 1,
              elevation: 10,
            },
          },
          {
            actor: targetActor,
            center: {
              x: 100,
              y: 0,
            },
            document: {
              actorId: "t",
              width: 2,
              height: 2,
              elevation: 0,
              regions: new Set([
                {
                  flags: {
                    "tw2k-tactical": {
                      terrainType: "forest",
                    },
                  },
                },
              ]),
            },
          },
        ],
      },
    };

    const factory = new FoundryAttackDialogInitialFactory(
      () => canvas,
      new FoundryWeaponCategoryResolver(),
    );

    const result = factory.create({
      attackerActor,
      targetActor,
      weapon: createWeapon(),
    });

    expect(result.targetProne).toBe(true);
    expect(result.targetSize).toBe("large");
    expect(result.elevatedPosition).toBe(true);
    expect(result.targetTerrainModifier).toBe(-1);
  });

  it("detects scope and bipod capability without assuming bipod deployment", () => {
    const attackerActor = {
      id: "a",
      statuses: new Set(["prone"]),
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
              attachedWeaponId: "w",
            },
          },
        },
        {
          type: "gear",
          name: "Bipod",
          system: {
            equipped: true,
            backpack: false,
          },
          flags: {
            "tw2k-tactical": {
              attachedWeaponId: "w",
            },
          },
        },
        {
          type: "gear",
          name: "Tripod",
          system: {
            equipped: true,
            backpack: false,
          },
          flags: {
            "tw2k-tactical": {
              attachedWeaponId: "w",
            },
          },
        },
      ],
    };
    const targetActor = { id: "t" };
    const weapon = {
      ...createWeapon(),
      system: {
        ...createWeapon().system,
        props: {
          scope: true,
          bipod: true,
          tripod: true,
          mounted: true,
        },
      },
    };

    const canvas = {
      grid: { size: 100 },
      tokens: {
        placeables: [
          {
            actor: attackerActor,
            center: { x: 0, y: 0 },
            document: { actorId: "a", width: 1, height: 1 },
          },
          {
            actor: targetActor,
            center: { x: 100, y: 0 },
            document: { actorId: "t", width: 1, height: 1 },
          },
        ],
      },
    };

    const result = new FoundryAttackDialogInitialFactory(
      () => canvas,
      new FoundryWeaponCategoryResolver(),
    ).create({
      attackerActor,
      targetActor,
      weapon,
    });

    expect(result.hasTelescopicSight).toBe(true);
    expect(result.hasBipod).toBe(true);
    expect(result.bipodDeployed).toBe(false);
    expect(result.hasTripod).toBe(true);
    expect(result.tripodDeployed).toBe(false);
    expect(result.vehicleMounted).toBe(true);
    expect(result.attackerProne).toBe(true);
    expect(result.stablePlatform).toBe(false);
  });

});
