export type HitLocation =
  | "legs"
  | "torso"
  | "arm"
  | "head";

export interface HitLocationRoller {
  rollD6(): Promise<number>;
}

export class HitLocationResolver {
  constructor(
    private readonly roller: HitLocationRoller,
  ) {}

  async resolve(
    chosenLocation?: HitLocation,
  ): Promise<HitLocation> {
    if (chosenLocation) {
      return chosenLocation;
    }

    const roll = await this.roller.rollD6();

    if (
      !Number.isInteger(roll) ||
      roll < 1 ||
      roll > 6
    ) {
      throw new Error(
        "Hit-location roll must be an integer from 1 to 6.",
      );
    }

    if (roll === 1) {
      return "legs";
    }

    if (roll <= 4) {
      return "torso";
    }

    if (roll === 5) {
      return "arm";
    }

    return "head";
  }
}
