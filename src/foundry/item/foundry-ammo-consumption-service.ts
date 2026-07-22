import type {
  AmmoAttackResult,
} from "../../combat/ammo-resolver";
import type {
  T2K4EActorLike,
  T2K4EItemLike,
} from "../t2k4e/t2k4e-types";

type UnknownRecord =
  Record<string, unknown>;

export class FoundryAmmoConsumptionService {
  async consume(
    actor: unknown,
    result: AmmoAttackResult,
  ): Promise<void> {
    const ammunition =
      Array.from(
        (
          actor as
            T2K4EActorLike
        )?.items ?? [],
      ).find(
        (item) =>
          item.id ===
          result.ammunitionItemId,
      );

    if (!ammunition) {
      throw new Error(
        "The loaded ammunition item no longer exists.",
      );
    }

    const current =
      this.readCurrentRounds(
        ammunition,
      );

    if (
      current !==
      result.roundsBefore
    ) {
      throw new Error(
        "Loaded ammunition changed while the attack was resolving; no ammunition was consumed.",
      );
    }

    if (
      typeof ammunition.update !==
      "function"
    ) {
      throw new Error(
        "The loaded ammunition item cannot be updated.",
      );
    }

    await ammunition.update({
      "system.ammo.value":
        result.roundsRemaining,
    });
  }

  private readCurrentRounds(
    item: T2K4EItemLike,
  ): number | undefined {
    const system =
      this.asRecord(
        item.system,
      );
    const ammo =
      this.asRecord(
        system?.ammo,
      );
    const value =
      ammo?.value;
    const parsed =
      typeof value === "number"
        ? value
        : typeof value ===
            "string"
        ? Number(value)
        : Number.NaN;

    return Number.isFinite(parsed)
      ? Math.max(
          0,
          Math.trunc(parsed),
        )
      : undefined;
  }

  private asRecord(
    value: unknown,
  ): UnknownRecord | undefined {
    return value &&
      typeof value === "object"
      ? value as UnknownRecord
      : undefined;
  }
}
