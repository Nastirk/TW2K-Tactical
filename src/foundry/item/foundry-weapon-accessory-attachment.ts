type UnknownRecord = Record<string, unknown>;

export type FoundryWeaponAccessoryKind = "scope" | "bipod" | "tripod";

const MODULE_ID = "tw2k-tactical";
const ATTACHED_WEAPON_FLAG = "attachedWeaponId";

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object"
    ? value as UnknownRecord
    : null;
}

function readPath(source: unknown, path: readonly string[]): unknown {
  let current: unknown = source;

  for (const segment of path) {
    const record = asRecord(current);
    if (!record) {
      return undefined;
    }
    current = record[segment];
  }

  return current;
}

function readCollectionValues(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    Symbol.iterator in value
  ) {
    return Array.from(value as Iterable<unknown>);
  }

  const contents = readPath(value, ["contents"]);
  return Array.isArray(contents) ? contents : [];
}

export function readFoundryDocumentId(value: unknown): string | undefined {
  const id = readPath(value, ["id"])
    ?? readPath(value, ["_id"]);

  return typeof id === "string" && id.length > 0
    ? id
    : undefined;
}

export function detectWeaponAccessoryKind(
  item: unknown,
): FoundryWeaponAccessoryKind | undefined {
  const type = readPath(item, ["type"]);

  if (
    typeof type === "string" &&
    type.toLowerCase() !== "gear"
  ) {
    return undefined;
  }

  const description = [
    readPath(item, ["name"]),
    readPath(item, ["system", "itemType"]),
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  if (/\btelescopic\b|\bscope\b/.test(description)) {
    return "scope";
  }

  if (/\bbipod\b/.test(description)) {
    return "bipod";
  }

  if (/\btripod\b/.test(description)) {
    return "tripod";
  }

  return undefined;
}

export function readAttachedWeaponId(
  item: unknown,
): string | undefined {
  const direct = readPath(
    item,
    ["flags", MODULE_ID, ATTACHED_WEAPON_FLAG],
  );

  if (typeof direct === "string" && direct.length > 0) {
    return direct;
  }

  const getFlag = asRecord(item)?.getFlag;

  if (typeof getFlag !== "function") {
    return undefined;
  }

  const value = getFlag.call(
    item,
    MODULE_ID,
    ATTACHED_WEAPON_FLAG,
  );

  return typeof value === "string" && value.length > 0
    ? value
    : undefined;
}

/**
 * Attachment is the source of truth, so the selector must allow the player
 * to choose a weapon even when the corresponding T2K4E property is not yet
 * checked. Persisting the attachment mirrors the property onto the weapon.
 */
export function getCompatibleWeapons(
  actor: unknown,
  _kind: FoundryWeaponAccessoryKind,
): unknown[] {
  return readCollectionValues(
    readPath(actor, ["items"]),
  ).filter((item) => {
    const type = readPath(item, ["type"]);

    return (
      typeof type === "string" &&
      type.toLowerCase() === "weapon"
    );
  });
}

function findWeapon(
  actor: unknown,
  weaponId: string,
): unknown | undefined {
  return readCollectionValues(
    readPath(actor, ["items"]),
  ).find(
    (item) =>
      readPath(item, ["type"]) === "weapon" &&
      readFoundryDocumentId(item) === weaponId,
  );
}

function isSameDocument(
  left: unknown,
  right: unknown,
): boolean {
  if (left === right) {
    return true;
  }

  const leftId = readFoundryDocumentId(left);
  const rightId = readFoundryDocumentId(right);

  return Boolean(
    leftId &&
    rightId &&
    leftId === rightId,
  );
}

function hasOtherAttachedAccessory(
  actor: unknown,
  currentAccessory: unknown,
  kind: FoundryWeaponAccessoryKind,
  weaponId: string,
): boolean {
  return readCollectionValues(
    readPath(actor, ["items"]),
  ).some((candidate) => {
    if (isSameDocument(candidate, currentAccessory)) {
      return false;
    }

    return (
      detectWeaponAccessoryKind(candidate) === kind &&
      readAttachedWeaponId(candidate) === weaponId
    );
  });
}

async function updateWeaponAccessoryProperty(
  weapon: unknown,
  kind: FoundryWeaponAccessoryKind,
  enabled: boolean,
): Promise<void> {
  const update = asRecord(weapon)?.update;

  if (typeof update !== "function") {
    return;
  }

  await update.call(
    weapon,
    {
      [`system.props.${kind}`]: enabled,
    },
  );
}

async function persistAttachmentFlag(
  item: unknown,
  weaponId: string | undefined,
): Promise<void> {
  const record = asRecord(item);
  if (!record) {
    return;
  }

  if (weaponId) {
    const setFlag = record.setFlag;
    if (typeof setFlag === "function") {
      await setFlag.call(
        item,
        MODULE_ID,
        ATTACHED_WEAPON_FLAG,
        weaponId,
      );
      return;
    }
  } else {
    const unsetFlag = record.unsetFlag;
    if (typeof unsetFlag === "function") {
      await unsetFlag.call(
        item,
        MODULE_ID,
        ATTACHED_WEAPON_FLAG,
      );
      return;
    }
  }

  const update = record.update;
  if (typeof update !== "function") {
    return;
  }

  await update.call(
    item,
    weaponId
      ? {
        [`flags.${MODULE_ID}.${ATTACHED_WEAPON_FLAG}`]: weaponId,
      }
      : {
        [`flags.${MODULE_ID}.-=${ATTACHED_WEAPON_FLAG}`]: null,
      },
  );
}

/**
 * Persists the TW2K Tactical attachment and mirrors that attachment onto the
 * selected weapon's native T2K4E capability property.
 *
 * Attachment remains distinct from deployment: attaching a bipod/tripod
 * checks the weapon capability and exposes the deployment control, but does
 * not automatically mark the support as deployed for an attack.
 */
export async function persistAttachedWeaponId(
  item: unknown,
  weaponId: string | undefined,
): Promise<void> {
  const kind = detectWeaponAccessoryKind(item);
  const actor = asRecord(item)?.parent;
  const previousWeaponId = readAttachedWeaponId(item);

  await persistAttachmentFlag(
    item,
    weaponId,
  );

  if (!kind || !actor) {
    return;
  }

  if (weaponId) {
    const newWeapon = findWeapon(
      actor,
      weaponId,
    );

    if (newWeapon) {
      await updateWeaponAccessoryProperty(
        newWeapon,
        kind,
        true,
      );
    }
  }

  if (
    previousWeaponId &&
    previousWeaponId !== weaponId &&
    !hasOtherAttachedAccessory(
      actor,
      item,
      kind,
      previousWeaponId,
    )
  ) {
    const previousWeapon = findWeapon(
      actor,
      previousWeaponId,
    );

    if (previousWeapon) {
      await updateWeaponAccessoryProperty(
        previousWeapon,
        kind,
        false,
      );
    }
  }
}
