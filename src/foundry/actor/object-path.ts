export function getPath(
  source: unknown,
  path: string,
): unknown {
  if (
    source === null ||
    source === undefined
  ) {
    return undefined;
  }

  return path
    .split(".")
    .reduce<unknown>(
      (current, key) => {
        if (
          typeof current !==
            "object" ||
          current === null
        ) {
          return undefined;
        }

        return (
          current as
            Record<string, unknown>
        )[key];
      },
      source,
    );
}
