export type HitLocation =
  | "head"
  | "torso"
  | "left-arm"
  | "right-arm"
  | "left-leg"
  | "right-leg";

export interface HitLocationTable {
  resolve(roll: number): HitLocation;
}

export interface HitLocationRoller {
  roll(): Promise<number>;
}

export class HitLocationResolver {
  constructor(
    private readonly roller: HitLocationRoller,
    private readonly table: HitLocationTable,
  ) {}

  async resolve(): Promise<HitLocation> {
    const roll = await this.roller.roll();

    if (!Number.isInteger(roll) || roll < 1) {
      throw new Error("Hit-location roll must be a positive integer.");
    }

    return this.table.resolve(roll);
  }
}
