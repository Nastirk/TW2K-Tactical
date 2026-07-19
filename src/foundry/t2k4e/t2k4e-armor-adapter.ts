import type {
  HitLocation,
} from "../../combat/hit-location-resolver";
import type {
  T2K4EItemLike,
} from "./t2k4e-types";
import {
  firstDefined,
  readBoolean,
  readInteger,
} from "./t2k4e-path-reader";

export interface T2KArmorProfile {
  itemId: string;
  armorLevel: number;
  locations: HitLocation[];
}

export class T2K4EArmorAdapter {
  constructor(
    private readonly item:
      T2K4EItemLike,
  ) {}

  isEquipped(): boolean {
    return readBoolean(
      this.item,
      [
        "system.equipped",
        "system.isEquipped",
      ],
    );
  }

  toProfile():
    T2KArmorProfile {
    const armorLevel =
      readInteger(
        this.item,
        [
          "system.armor",
          "system.armorLevel",
          "system.protection",
        ],
        "armor level",
      );

    const rawLocations =
      firstDefined(
        this.item,
        [
          "system.locations",
          "system.location",
          "system.protects",
        ],
      );

    return {
      itemId:
        this.item.id,
      armorLevel,
      locations:
        normalizeLocations(
          rawLocations,
        ),
    };
  }
}

function normalizeLocations(
  value: unknown,
): HitLocation[] {
  const allowed:
    HitLocation[] = [
      "head",
      "torso",
      "arm",
      "legs",
    ];

  if (Array.isArray(value)) {
    return value.filter(
      (
        entry,
      ): entry is HitLocation =>
        allowed.includes(
          entry as HitLocation,
        ),
    );
  }

  if (
    typeof value === "string"
  ) {
    const normalized =
      value.toLowerCase();

    return allowed.filter(
      (location) =>
        normalized.includes(
          location,
        ) ||
        (
          location === "arm" &&
          normalized.includes(
            "arms",
          )
        ) ||
        (
          location === "legs" &&
          normalized.includes(
            "leg",
          )
        ),
    );
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return allowed.filter(
      (location) =>
        Boolean(
          (
            value as Record<
              string,
              unknown
            >
          )[location],
        ),
    );
  }

  return [];
}
