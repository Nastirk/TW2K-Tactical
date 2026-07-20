import type { HitLocation } from "../../combat/hit-location-resolver";
import { FoundryDieRoller } from "../dice/foundry-die-roller";
import type { FoundryHitLocationResolver } from "./foundry-live-attack-dialog-collector";

export class FoundryRandomHitLocationResolver
  implements FoundryHitLocationResolver {
  constructor(
    private readonly dieRoller: Pick<FoundryDieRoller, "rollDie"> =
      new FoundryDieRoller(),
  ) {}

  async resolve(): Promise<HitLocation> {
    const roll = await this.dieRoller.rollDie(6);

    if (!Number.isInteger(roll) || roll < 1 || roll > 6) {
      throw new Error(
        `Invalid TW2K hit-location D6 result: ${roll}`,
      );
    }

    if (roll === 1) {
      return "legs" as HitLocation;
    }

    if (roll <= 4) {
      return "torso" as HitLocation;
    }

    if (roll === 5) {
      return "arm" as HitLocation;
    }

    return "head" as HitLocation;
  }
}
