export interface FoundryWeaponSheetActionContext {
  attackerActor: unknown;
  weapon: unknown;
  addAttackAction(callback: () => void | Promise<void>): void;
  addReloadAction?(callback: () => void | Promise<void>): void;
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

interface DomElementLike {
  querySelector?(selector: string): DomElementLike | null;
  insertAdjacentHTML?(position: string, text: string): void;
  addEventListener?(
    type: string,
    handler: (event: unknown) => unknown,
  ): void;
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

    const weaponType = typeof weapon?.type === "string"
      ? weapon.type.toLowerCase()
      : "";

    if (
      !weapon ||
      weaponType !== this.weaponItemType.toLowerCase()
    ) {
      return null;
    }

    const attackerActor = weapon.parent ?? app?.actor;

    if (!attackerActor) {
      return null;
    }

    const jqueryRoot = this.asJQueryRoot(html);
    const domRoot = this.asDomRoot(html);

    if (!jqueryRoot && !domRoot) {
      return null;
    }

    return {
      attackerActor,
      weapon,
      addAttackAction: (callback) => {
        if (jqueryRoot) {
          this.addJQueryAttackAction(jqueryRoot, callback);
          return;
        }

        if (domRoot) {
          this.addDomAttackAction(domRoot, callback);
        }
      },
      addReloadAction: (callback) => {
        if (jqueryRoot) {
          this.addJQueryAction(
            jqueryRoot,
            "reload",
            this.reloadButtonHtml(),
            callback,
          );
          return;
        }

        if (domRoot) {
          this.addDomAction(
            domRoot,
            "reload",
            this.reloadButtonHtml(),
            callback,
          );
        }
      },
    };
  }

  private addJQueryAttackAction(
    root: JQueryRootLike,
    callback: () => void | Promise<void>,
  ): void {
    this.addJQueryAction(
      root,
      "attack",
      this.attackButtonHtml(),
      callback,
    );
  }

  private addDomAttackAction(
    root: DomElementLike,
    callback: () => void | Promise<void>,
  ): void {
    this.addDomAction(
      root,
      "attack",
      this.attackButtonHtml(),
      callback,
    );
  }

  private addJQueryAction(
    root: JQueryRootLike,
    action: string,
    buttonHtml: string,
    callback: () => void | Promise<void>,
  ): void {
    const buttonSelector =
      `[data-tw2k-tactical-action="${action}"]`;

    if (root.find(buttonSelector).length > 0) {
      return;
    }

    const header = this.findJQueryHeader(root);

    if (!header) {
      return;
    }

    header.append(buttonHtml);

    root.find(buttonSelector).on(
      "click",
      async (event: unknown) => {
        this.preventDefault(event);
        await callback();
      },
    );
  }

  private addDomAction(
    root: DomElementLike,
    action: string,
    buttonHtml: string,
    callback: () => void | Promise<void>,
  ): void {
    const buttonSelector =
      `[data-tw2k-tactical-action="${action}"]`;

    if (root.querySelector?.(buttonSelector)) {
      return;
    }

    const header = this.findDomHeader(root);

    if (!header?.insertAdjacentHTML) {
      return;
    }

    header.insertAdjacentHTML(
      "beforeend",
      buttonHtml,
    );

    const button = root.querySelector?.(buttonSelector);

    button?.addEventListener?.(
      "click",
      async (event: unknown) => {
        this.preventDefault(event);
        await callback();
      },
    );
  }

  private findJQueryHeader(
    root: JQueryRootLike,
  ): JQueryCollectionLike | null {
    for (const selector of [this.headerSelector, "form"]) {
      const element = root.find(selector);

      if (element.length > 0) {
        return element;
      }
    }

    return null;
  }

  private findDomHeader(
    root: DomElementLike,
  ): DomElementLike | null {
    return root.querySelector?.(this.headerSelector)
      ?? root.querySelector?.("form")
      ?? null;
  }

  private attackButtonHtml(): string {
    return '<button type="button" class="tw2k-tactical-weapon-attack" data-tw2k-tactical-action="attack">TW2K Tactical Attack</button>';
  }

  private reloadButtonHtml(): string {
    return '<button type="button" class="tw2k-tactical-weapon-reload" data-tw2k-tactical-action="reload">TW2K Tactical Reload</button>';
  }

  private preventDefault(event: unknown): void {
    if (
      event &&
      typeof event === "object" &&
      "preventDefault" in event &&
      typeof (event as { preventDefault?: unknown }).preventDefault === "function"
    ) {
      (event as { preventDefault: () => void }).preventDefault();
    }
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

  private asDomRoot(value: unknown): DomElementLike | null {
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
}
