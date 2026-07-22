import {
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  FoundryAttackDialogService,
} from "../../../src/foundry/dialog/foundry-attack-dialog-service";
import type {
  FoundryDialogConfigLike,
} from "../../../src/foundry/dialog/foundry-dialog-types";
import {
  AttackDialogParser,
} from "../../../src/ui/attack-dialog-parser";
import {
  AttackDialogRenderer,
} from "../../../src/ui/attack-dialog-renderer";
import {
  AttackDialogRequestFactory,
} from "../../../src/ui/attack-dialog-request-factory";
import {
  AttackDialogValidator,
} from "../../../src/ui/attack-dialog-validator";

describe("FoundryAttackDialogService", () => {
  it("retains the trusted ammo-dice maximum when parsing the submitted form", async () => {
    let dialogConfig:
      FoundryDialogConfigLike | undefined;

    class DialogStub {
      constructor(
        config: FoundryDialogConfigLike,
      ) {
        dialogConfig = config;
      }

      render(): void {}
    }

    const onSubmit = vi.fn();
    const service =
      new FoundryAttackDialogService(
        DialogStub,
        new AttackDialogRenderer(),
        new AttackDialogParser(),
        new AttackDialogValidator(),
        new AttackDialogRequestFactory(),
      );

    service.open({
      combat: {
        attackerId: "attacker",
        targetId: "target",
        targetActorId: "target",
        weaponId: "weapon",
        baseAttributeDie: 8,
        baseSkillDie: 8,
        weaponBaseDamage: 2,
        critThreshold: 3,
        weaponArmorModifier: 0,
        ammunition: {
          ammunitionItemId: "magazine",
          rateOfFire: 3,
          roundsBefore: 10,
          ammoDice: 0,
          allocation: "damage",
          slowAim: false,
        },
      },
      initial: {
        weaponCategory: "assault-rifle",
        aimMode: "fast",
        calledShot: false,
        targetProne: false,
        targetInFullCover: false,
        approximateTargetLocationKnown: false,
        targetMoved: false,
        firingFromMovingVehicle: false,
        targetSize: "normal",
        elevatedPosition: false,
        targetTerrainModifier: 0,
        lightLevel: "normal",
        weatherModifier: 0,
        denseSmoke: false,
        hasNightVision: false,
        hasThermalOptics: false,
        machineGunCarried: false,
        oneHanded: false,
        atShortRange: true,
        hasTelescopicSight: false,
        hasBipod: false,
        bipodDeployed: false,
        hasTripod: false,
        tripodDeployed: false,
        vehicleMounted: false,
        stablePlatform: false,
        ammoTracked: true,
        ammoDice: 0,
        maxAmmoDice: 3,
        roundsRemaining: 10,
        ammoSuccessAllocation: "damage",
      },
      onSubmit,
    });

    const values = new Map<string, string>([
      ["aimMode", "fast"],
      ["targetSize", "normal"],
      ["targetTerrainModifier", "0"],
      ["lightLevel", "normal"],
      ["weatherModifier", "0"],
      ["ammoDice", "2"],
      ["ammoSuccessAllocation", "damage"],
    ]);

    await dialogConfig?.buttons.attack.callback?.({
      formData: {
        get: (name: string) =>
          values.get(name),
      },
    });

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        combat: expect.objectContaining({
          ammunition: expect.objectContaining({
            ammoDice: 2,
          }),
        }),
      }),
    );
  });
});
