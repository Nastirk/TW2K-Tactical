export interface FoundryWeaponSheetActionContext {
  attackerActor: unknown;
  weapon: unknown;
  addAttackAction(callback: () => void | Promise<void>): void;
}

export interface FoundryWeaponSheetAdapter {
  resolve(
    application: unknown,
    html: unknown,
  ): FoundryWeaponSheetActionContext | null;
}

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

interface ItemLike {
  type?: unknown;
  parent?: unknown;
}

interface ApplicationLike {
  object?: unknown;
  item?: unknown;
  document?: unknown;
  actor?: unknown;
}

export class FoundryJQueryWeaponSheetAdapter implements FoundryWeaponSheetAdapter {
  constructor(
    private readonly weaponItemType = "weapon",
    private readonly headerSelector = ".sheet-header",
  ) {}

  resolve(
    application: unknown,
    html: unknown,
  ): FoundryWeaponSheetActionContext | null {
    const app = this.asApplication(application);
    const weapon = this.asItem(
      app?.object ?? app?.item ?? app?.document,
    );

    if (!weapon || weapon.type !== this.weaponItemType) {
      return null;
    }

    const attackerActor = weapon.parent ?? app?.actor;

    if (!attackerActor) {
      return null;
    }

    const root = this.asJQueryRoot(html);

    if (!root) {
      return null;
    }

    return {
      attackerActor,
      weapon,
      addAttackAction: (callback) => {
        this.addAttackAction(root, callback);
      },
    };
  }

  private addAttackAction(
    root: JQueryRootLike,
    callback: () => void | Promise<void>,
  ): void {
    const buttonSelector =
      '[data-tw2k-tactical-action="attack"]';

    if (root.find(buttonSelector).length > 0) {
      return;
    }

    const header = root.find(this.headerSelector);

    if (header.length === 0) {
      return;
    }

    header.append(
      '<button type="button" class="tw2k-tactical-weapon-attack" data-tw2k-tactical-action="attack">TW2K Tactical Attack</button>',
    );

    root.find(buttonSelector).on(
      "click",
      async (event: unknown) => {
        if (
          event &&
          typeof event === "object" &&
          "preventDefault" in event &&
          typeof (event as { preventDefault?: unknown }).preventDefault === "function"
        ) {
          (event as { preventDefault: () => void }).preventDefault();
        }

        await callback();
      },
    );
  }

  private asApplication(value: unknown): ApplicationLike | null {
    return value && typeof value === "object"
      ? value as ApplicationLike
      : null;
  }

  private asItem(value: unknown): ItemLike | null {
    return value && typeof value === "object"
      ? value as ItemLike
      : null;
  }

  private asJQueryRoot(value: unknown): JQueryRootLike | null {
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
}
