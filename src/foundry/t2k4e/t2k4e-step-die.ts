import type {
  StepDie,
} from "../../dice/types";

export function normalizeStepDie(
  value: unknown,
  label: string,
): StepDie {
  if (
    value === 6 ||
    value === 8 ||
    value === 10 ||
    value === 12
  ) {
    return value;
  }

  if (
    typeof value === "string"
  ) {
    const normalized =
      value
        .trim()
        .toLowerCase();

    const match =
      normalized.match(
        /^d?(6|8|10|12)$/,
      );

    if (match) {
      return Number(
        match[1],
      ) as StepDie;
    }

    const gradeMap:
      Record<string, StepDie> = {
        d: 6,
        c: 8,
        b: 10,
        a: 12,
      };

    if (
      gradeMap[normalized]
    ) {
      return gradeMap[
        normalized
      ];
    }
  }

  throw new Error(
    `Unable to normalize ${label} as a TW2K step die.`,
  );
}
