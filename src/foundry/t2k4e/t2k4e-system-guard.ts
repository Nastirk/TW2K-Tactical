import type {
  T2K4EGameLike,
} from "./t2k4e-types";

export function assertT2K4ESystem(
  game: T2K4EGameLike,
): void {
  if (
    game.system?.id !==
    "t2k4e"
  ) {
    throw new Error(
      'TW2K Tactical requires the official Foundry system "t2k4e".',
    );
  }
}
