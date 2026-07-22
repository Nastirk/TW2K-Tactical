import type {
  AmmoAttackRequest,
} from "../../combat/ammo-resolver";
import type {
  T2K4EActorLike,
  T2K4EItemLike,
} from "./t2k4e-types";

type UnknownRecord =
  Record<string, unknown>;

export interface T2KWeaponAmmoState {
  ammunitionItemId: string;
  rateOfFire: number;
  roundsRemaining: number;
  magazineCapacity: number;
  caliber: string;
}

export interface T2KReloadCandidate {
  item: T2K4EItemLike;
  ammunitionItemId: string;
  name: string;
  roundsRemaining: number;
  capacity: number;
}

export class T2K4EAmmunitionAdapter {
  getWeaponAmmoState(
    actor: T2K4EActorLike,
    weapon: T2K4EItemLike,
  ): T2KWeaponAmmoState | undefined {
    const profile =
      this.readWeaponMagazine(
        weapon,
      );

    if (!profile) {
      return undefined;
    }

    const ammunition =
      this.getActorItems(actor)
        .find(
          (item) =>
            item.id ===
            profile.target,
        );

    const ammo =
      this.readAmmoQuantity(
        ammunition,
      );

    if (!ammunition || !ammo) {
      return undefined;
    }

    return {
      ammunitionItemId:
        ammunition.id,
      rateOfFire:
        profile.rateOfFire,
      roundsRemaining:
        ammo.value,
      magazineCapacity:
        profile.capacity,
      caliber:
        profile.caliber,
    };
  }

  toAttackRequest(
    state: T2KWeaponAmmoState,
  ): AmmoAttackRequest {
    return {
      ammunitionItemId:
        state.ammunitionItemId,
      rateOfFire:
        state.rateOfFire,
      roundsBefore:
        state.roundsRemaining,
      ammoDice: 0,
      allocation: "damage",
      slowAim: false,
    };
  }

  getReloadCandidates(
    actor: T2K4EActorLike,
    weapon: T2K4EItemLike,
  ): T2KReloadCandidate[] {
    const profile =
      this.readWeaponMagazine(
        weapon,
      );

    if (!profile) {
      return [];
    }

    return this.getActorItems(actor)
      .filter(
        (item) =>
          item.id !==
          profile.target,
      )
      .flatMap(
        (item) => {
          const quantity =
            this.readAmmoQuantity(
              item,
            );

          if (
            !quantity ||
            quantity.value <= 0 ||
            quantity.max !==
              profile.capacity ||
            !this.isAmmunitionItem(
              item,
              profile.caliber,
            )
          ) {
            return [];
          }

          return [{
            item,
            ammunitionItemId:
              item.id,
            name:
              item.name ??
              "Ammunition",
            roundsRemaining:
              quantity.value,
            capacity:
              quantity.max,
          }];
        },
      );
  }

  private readWeaponMagazine(
    weapon: T2K4EItemLike,
  ): {
    target: string;
    capacity: number;
    rateOfFire: number;
    caliber: string;
  } | undefined {
    if (
      weapon.type.toLowerCase() !==
      "weapon"
    ) {
      return undefined;
    }

    const system =
      this.asRecord(
        weapon.system,
      );
    const magazine =
      this.asRecord(
        system?.mag,
      );
    const target =
      magazine?.target;
    const capacity =
      this.readNonNegativeInteger(
        magazine?.max,
      );
    const rateOfFire =
      this.readNonNegativeInteger(
        system?.rof,
      );
    const caliber =
      typeof system?.ammo ===
        "string"
        ? system.ammo.trim()
        : "";

    if (
      typeof target !==
        "string" ||
      target.length === 0 ||
      capacity === undefined ||
      rateOfFire === undefined
    ) {
      return undefined;
    }

    return {
      target,
      capacity,
      rateOfFire,
      caliber,
    };
  }

  private readAmmoQuantity(
    item:
      T2K4EItemLike | undefined,
  ): {
    value: number;
    max: number;
  } | undefined {
    const system =
      this.asRecord(
        item?.system,
      );
    const ammo =
      this.asRecord(
        system?.ammo,
      );
    const value =
      this.readNonNegativeInteger(
        ammo?.value,
      );
    const max =
      this.readNonNegativeInteger(
        ammo?.max,
      );

    if (
      value === undefined ||
      max === undefined
    ) {
      return undefined;
    }

    return {
      value:
        Math.min(value, max),
      max,
    };
  }

  private isAmmunitionItem(
    item: T2K4EItemLike,
    caliber: string,
  ): boolean {
    const system =
      this.asRecord(
        item.system,
      );
    const itemType = [
      item.type,
      typeof system?.itemType ===
        "string"
        ? system.itemType
        : "",
    ]
      .join(" ")
      .toLowerCase();

    const markedAsAmmo =
      /ammo|ammunition|magazine|belt/
        .test(itemType);

    const normalizedCaliber =
      this.normalize(caliber);
    const normalizedDeclaredCaliber =
      this.normalize(
        typeof system?.itemType ===
          "string"
          ? system.itemType
          : "",
      );
    const normalizedName =
      this.normalize(
        item.name ?? "",
      );

    const declaredCaliberMatches =
      normalizedCaliber.length > 0 &&
      normalizedDeclaredCaliber ===
        normalizedCaliber;
    const nameCaliberMatches =
      normalizedCaliber.length > 0 &&
      normalizedName.includes(
        normalizedCaliber,
      );

    // Official T2K4E ammunition uses item.type="ammunition" and may store
    // the caliber in system.itemType. System-created magazines can omit that
    // field, so a caliber-bearing item name remains a deliberately narrow
    // fallback instead of accepting every item with an ammo counter.
    return markedAsAmmo &&
      (
        declaredCaliberMatches ||
        nameCaliberMatches
      );
  }

  private getActorItems(
    actor: T2K4EActorLike,
  ): T2K4EItemLike[] {
    return Array.from(
      actor.items ?? [],
    );
  }

  private readNonNegativeInteger(
    value: unknown,
  ): number | undefined {
    const parsed =
      typeof value === "number"
        ? value
        : typeof value ===
            "string" &&
          value.trim().length > 0
        ? Number(value)
        : Number.NaN;

    if (
      !Number.isFinite(parsed) ||
      parsed < 0
    ) {
      return undefined;
    }

    return Math.trunc(parsed);
  }

  private asRecord(
    value: unknown,
  ): UnknownRecord | undefined {
    return value &&
      typeof value === "object"
      ? value as UnknownRecord
      : undefined;
  }

  private normalize(
    value: string,
  ): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }
}
