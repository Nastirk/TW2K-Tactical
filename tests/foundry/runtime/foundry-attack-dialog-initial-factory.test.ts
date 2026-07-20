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
    expect(result.aimMode).toBe("fast");
    expect(result.targetTerrainModifier).toBe(0);
    expect(result.weatherModifier).toBe(0);
    expect(result.targetProne).toBe(false);
    expect(result.targetSize).toBe("normal");
    expect(result.elevatedPosition).toBe(false);
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
});
