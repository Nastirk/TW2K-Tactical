export function getNested(
  source: unknown,
  path: string,
): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) => {
        if (
          value === null ||
          typeof value !== "object"
        ) {
          return undefined;
        }

        return (
          value as Record<
            string,
            unknown
          >
        )[key];
      },
      source,
    );
}

export function firstDefined(
  source: unknown,
  paths: readonly string[],
): unknown {
  for (const path of paths) {
    const value =
      getNested(source, path);

    if (
      value !== undefined &&
      value !== null
    ) {
      return value;
    }
  }

  return undefined;
}

export function readInteger(
  source: unknown,
  paths: readonly string[],
  label: string,
): number {
  const value =
    firstDefined(
      source,
      paths,
    );

  if (
    typeof value === "number" &&
    Number.isInteger(value)
  ) {
    return value;
  }

  throw new Error(
    `Unable to read integer ${label}. Tried: ${paths.join(", ")}`,
  );
}

export function readBoolean(
  source: unknown,
  paths: readonly string[],
): boolean {
  const value =
    firstDefined(
      source,
      paths,
    );

  return Boolean(value);
}
