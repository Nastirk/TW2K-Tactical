import {
  detectWeaponAccessoryKind,
  getCompatibleWeapons,
  persistAttachedWeaponId,
  readAttachedWeaponId,
  readFoundryDocumentId,
} from "./foundry-weapon-accessory-attachment";

export interface FoundryWeaponAccessoryHookBus {
  on(
    hookName: string,
    callback: (
      application: unknown,
      html: unknown,
    ) => unknown,
  ): unknown;
}

type UnknownRecord = Record<string, unknown>;

interface JQueryCollectionLike {
  length: number;
  append(content: string): unknown;
  on(
    eventName: string,
    handler: (event: unknown) => unknown,
  ): unknown;
}

interface JQueryRootLike {
  find(selector: string): JQueryCollectionLike;
}

interface DomElementLike {
  querySelector?(selector: string): DomElementLike | null;
  insertAdjacentHTML?(position: string, text: string): void;
  addEventListener?(
    type: string,
    handler: (event: unknown) => unknown,
  ): void;
}

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object"
    ? value as UnknownRecord
    : null;
}

function resolveItem(application: unknown): unknown {
  const app = asRecord(application);
  return app?.object ?? app?.item ?? app?.document;
}

function resolveActor(
  application: unknown,
  item: unknown,
): unknown {
  return asRecord(item)?.parent
    ?? asRecord(application)?.actor;
}

function asJQueryRoot(value: unknown): JQueryRootLike | null {
  if (
    !value ||
    typeof value !== "object" ||
    !("find" in value) ||
    typeof (value as { find?: unknown }).find !== "function"
  ) {
    return null;
  }

  return value as JQueryRootLike;
}

function asDomRoot(value: unknown): DomElementLike | null {
  if (
    !value ||
    typeof value !== "object" ||
    !("querySelector" in value) ||
    typeof (value as { querySelector?: unknown }).querySelector !== "function"
  ) {
    return null;
  }

  return value as DomElementLike;
}

function readEventValue(event: unknown): string | undefined {
  const currentTarget = asRecord(
    asRecord(event)?.currentTarget,
  );
  const target = asRecord(
    asRecord(event)?.target,
  );
  const value = currentTarget?.value ?? target?.value;

  return typeof value === "string"
    ? value
    : undefined;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function readName(value: unknown): string {
  const name = asRecord(value)?.name;
  return typeof name === "string" && name.length > 0
    ? name
    : "Unnamed weapon";
}

function selectorHtml(
  weapons: unknown[],
  selectedWeaponId: string | undefined,
): string {
  const options = weapons
    .map((weapon) => {
      const id = readFoundryDocumentId(weapon);
      if (!id) {
        return "";
      }

      const selected = id === selectedWeaponId
        ? " selected"
        : "";

      return `<option value="${escapeHtml(id)}"${selected}>${escapeHtml(readName(weapon))}</option>`;
    })
    .join("");

  return `
    <div class="form-group tw2k-tactical-accessory-attachment" data-tw2k-tactical-accessory-attachment>
      <label>TW2K Tactical — Attached to</label>
      <select data-tw2k-tactical-action="accessory-attachment">
        <option value="">Not attached</option>
        ${options}
      </select>
      <p class="hint">The accessory only affects the selected weapon while this gear item is equipped and not stored in the backpack.</p>
    </div>
  `;
}

function injectJQuery(
  root: JQueryRootLike,
  html: string,
  onChange: (event: unknown) => Promise<void>,
): void {
  const selector = "[data-tw2k-tactical-accessory-attachment]";
  if (root.find(selector).length > 0) {
    return;
  }

  const container = [".sheet-body", "form"]
    .map((candidate) => root.find(candidate))
    .find((candidate) => candidate.length > 0);

  if (!container) {
    return;
  }

  container.append(html);

  root.find(
    '[data-tw2k-tactical-action="accessory-attachment"]',
  ).on("change", onChange);
}

function injectDom(
  root: DomElementLike,
  html: string,
  onChange: (event: unknown) => Promise<void>,
): void {
  const selector = "[data-tw2k-tactical-accessory-attachment]";
  if (root.querySelector?.(selector)) {
    return;
  }

  const container = root.querySelector?.(".sheet-body")
    ?? root.querySelector?.("form");

  if (!container?.insertAdjacentHTML) {
    return;
  }

  container.insertAdjacentHTML("beforeend", html);

  root.querySelector?.(
    '[data-tw2k-tactical-action="accessory-attachment"]',
  )?.addEventListener?.("change", onChange);
}

export function registerFoundryWeaponAccessoryAttachmentHook(
  hooks: FoundryWeaponAccessoryHookBus,
): void {
  const onRender = (
    application: unknown,
    html: unknown,
  ) => {
    const item = resolveItem(application);
    const kind = detectWeaponAccessoryKind(item);

    if (!kind) {
      return;
    }

    const actor = resolveActor(
      application,
      item,
    );

    if (!actor) {
      return;
    }

    const weapons = getCompatibleWeapons(
      actor,
      kind,
    );
    const rendered = selectorHtml(
      weapons,
      readAttachedWeaponId(item),
    );

    const onChange = async (
      event: unknown,
    ) => {
      const value = readEventValue(event);
      await persistAttachedWeaponId(
        item,
        value || undefined,
      );
    };

    const jqueryRoot = asJQueryRoot(html);
    if (jqueryRoot) {
      injectJQuery(
        jqueryRoot,
        rendered,
        onChange,
      );
      return;
    }

    const domRoot = asDomRoot(html);
    if (domRoot) {
      injectDom(
        domRoot,
        rendered,
        onChange,
      );
    }
  };

  hooks.on("renderItemSheet", onRender);
  hooks.on("renderItemSheetV2", onRender);
}
