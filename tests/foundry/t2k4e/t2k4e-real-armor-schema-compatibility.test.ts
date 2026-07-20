import {
  describe,
  expect,
  it,
} from "vitest";
import type {
  HitLocation,
} from "../../../src/combat/hit-location-resolver";
import {
  T2K4ECombatRequestFactory,
} from "../../../src/foundry/t2k4e/t2k4e-combat-request-factory";

interface ArmorLevelReader {
  getArmorLevels(
    target: unknown,
    location:
      HitLocation | undefined,
  ): number[];
}

function createArmor(
  name: string,
  rating: number,
  locations: {
    head?: boolean;
    arms?: boolean;
    torso?: boolean;
    legs?: boolean;
  },
  equipped = true,
) {
  return {
    id: name,
    name,
    type: "armor",
    system: {
      equipped,
      rating: {
        value: rating,
        max: rating,
      },
      location: {
        head: false,
        arms: false,
        torso: false,
        legs: false,
        ...locations,
      },
    },
  };
}

function createOrdinaryGear(
  name: string,
) {
  return {
    id: name,
    name,
    type: "gear",
    system: {
      qty: 1,
      itemType: "Field Gear",
      weight: 0,
      price: 20,
      equipped: true,
      backpack: false,
      description: "",
      rollModifiers: {},
      reliability: {
        value: null,
        max: null,
      },
      props: {
        twoHanded: false,
        mounted: false,
        disposable: false,
      },
      encumbrance: 0,
    },
  };
}

describe(
  "T2K4ECombatRequestFactory real T2K4E armor schema compatibility",
  () => {
    const factory =
      new T2K4ECombatRequestFactory();

    const readArmorLevels =
      (
        factory as unknown as
          ArmorLevelReader
      ).getArmorLevels.bind(
        factory,
      );

    const target = {
      id: "target",
      items: [
        createArmor(
          "Flak Jacket",
          1,
          {
            torso: true,
          },
        ),
        createArmor(
          "Soviet SSH-68",
          1,
          {
            head: true,
          },
        ),
        createArmor(
          "Plate Vest",
          2,
          {
            torso: true,
          },
        ),
      ],
    };

    it(
      "reads head armor from system.rating.value and system.location.head",
      () => {
        expect(
          readArmorLevels(
            target,
            "head" as
              HitLocation,
          ),
        ).toEqual([
          1,
        ]);
      },
    );

    it(
      "returns all applicable torso layers so the armor resolver can choose the highest",
      () => {
        expect(
          readArmorLevels(
            target,
            "torso" as
              HitLocation,
          ),
        ).toEqual([
          1,
          2,
        ]);
      },
    );

    it(
      "does not apply head or torso armor to unprotected limbs",
      () => {
        expect(
          readArmorLevels(
            target,
            "arm" as
              HitLocation,
          ),
        ).toEqual([]);

        expect(
          readArmorLevels(
            target,
            "legs" as
              HitLocation,
          ),
        ).toEqual([]);
      },
    );

    it(
      "maps TW2K Tactical arm to the T2K4E plural arms coverage key",
      () => {
        const armTarget = {
          id: "arm-target",
          items: [
            createArmor(
              "Arm Armor",
              3,
              {
                arms: true,
              },
            ),
          ],
        };

        expect(
          readArmorLevels(
            armTarget,
            "arm" as
              HitLocation,
          ),
        ).toEqual([
          3,
        ]);
      },
    );

    it(
      "ignores real-schema armor that is not equipped",
      () => {
        const targetWithUnequippedHelmet = {
          id: "target",
          items: [
            createArmor(
              "Unequipped Helmet",
              3,
              {
                head: true,
              },
              false,
            ),
          ],
        };

        expect(
          readArmorLevels(
            targetWithUnequippedHelmet,
            "head" as
              HitLocation,
          ),
        ).toEqual([]);
      },
    );

    it(
      "ignores ordinary equipped gear while resolving real T2K4E armor",
      () => {
        const realFoundryInventoryTarget = {
          id: "real-foundry-target",
          items: [
            createOrdinaryGear(
              "Fatigues",
            ),
            createArmor(
              "Flak Jacket",
              1,
              {
                torso: true,
              },
            ),
            createArmor(
              "Soviet SSH-68",
              1,
              {
                head: true,
              },
            ),
            createArmor(
              "Plate Vest",
              2,
              {
                torso: true,
              },
            ),
          ],
        };

        expect(
          readArmorLevels(
            realFoundryInventoryTarget,
            "head" as
              HitLocation,
          ),
        ).toEqual([
          1,
        ]);

        expect(
          readArmorLevels(
            realFoundryInventoryTarget,
            "torso" as
              HitLocation,
          ),
        ).toEqual([
          1,
          2,
        ]);

        expect(
          readArmorLevels(
            realFoundryInventoryTarget,
            "arm" as
              HitLocation,
          ),
        ).toEqual([]);

        expect(
          readArmorLevels(
            realFoundryInventoryTarget,
            "legs" as
              HitLocation,
          ),
        ).toEqual([]);
      },
    );
  },
);