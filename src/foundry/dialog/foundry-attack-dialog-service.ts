import { AttackDialogParser, type AttackDialogFormDataLike } from "../../ui/attack-dialog-parser";
import { AttackDialogRenderer } from "../../ui/attack-dialog-renderer";
import { AttackDialogRequestFactory } from "../../ui/attack-dialog-request-factory";
import type { AttackDialogInput } from "../../ui/attack-dialog-types";
import { AttackDialogValidator } from "../../ui/attack-dialog-validator";
import type { StagedEndToEndRangedCombatRequest } from "../../combat/staged-end-to-end-ranged-combat-workflow";
import type { ModifierAwareStagedRangedCombatRequest } from "../../combat/modifier-aware-staged-ranged-combat-workflow";
import type { FoundryDialogClassLike } from "./foundry-dialog-types";

export interface AttackDialogOpenRequest {
  combat: StagedEndToEndRangedCombatRequest;
  initial: AttackDialogInput;
  onSubmit: (
    request: ModifierAwareStagedRangedCombatRequest,
  ) => void | Promise<void>;
  onCancel?: () => void;
}

interface JQueryLikeRoot {
  find?(selector: string): ArrayLike<unknown>;
  0?: unknown;
}

export class FoundryAttackDialogService {
  constructor(
    private readonly Dialog: FoundryDialogClassLike,
    private readonly renderer: AttackDialogRenderer,
    private readonly parser: AttackDialogParser,
    private readonly validator: AttackDialogValidator,
    private readonly requestFactory: AttackDialogRequestFactory,
  ) {}

  open(request: AttackDialogOpenRequest): void {
    let completed = false;

    const cancel = () => {
      if (completed) {
        return;
      }

      completed = true;
      request.onCancel?.();
    };

    const dialog = new this.Dialog({
      title: "TW2K Tactical Attack",
      content: this.renderer.render(request.initial),
      buttons: {
        attack: {
          label: "Attack",
          callback: async (html) => {
            const form = this.extractFormData(html);
            const input = this.parser.parse(
              form,
              request.initial.weaponCategory,
            );

            this.validator.validate(input);

            const attackRequest = this.requestFactory.create(
              request.combat,
              input,
            );

            await request.onSubmit(attackRequest);
            completed = true;
          },
        },
        cancel: {
          label: "Cancel",
          callback: cancel,
        },
      },
      default: "attack",
      close: cancel,
    });

    dialog.render(true);
  }

  private extractFormData(html: unknown): AttackDialogFormDataLike {
    if (
      html &&
      typeof html === "object" &&
      "formData" in html
    ) {
      return (html as { formData: AttackDialogFormDataLike }).formData;
    }

    const formElement = this.findFormElement(html);

    if (
      formElement &&
      typeof FormData !== "undefined"
    ) {
      const formData = new FormData(formElement as HTMLFormElement);

      return {
        get(name: string) {
          const value = formData.get(name);

          if (typeof value === "string") {
            return value;
          }

          return undefined;
        },
      };
    }

    throw new Error("Unable to read attack dialog form data.");
  }

  private findFormElement(html: unknown): unknown | null {
    if (!html || typeof html !== "object") {
      return null;
    }

    const root = html as JQueryLikeRoot & {
      querySelector?: (selector: string) => unknown;
      matches?: (selector: string) => boolean;
    };

    if (root.matches?.("form")) {
      return root;
    }

    const directForm = root.querySelector?.("form");
    if (directForm) {
      return directForm;
    }

    const jqueryForm = root.find?.("form")?.[0];
    if (jqueryForm) {
      return jqueryForm;
    }

    const first = root[0] as {
      querySelector?: (selector: string) => unknown;
      matches?: (selector: string) => boolean;
    } | undefined;

    if (first?.matches?.("form")) {
      return first;
    }

    return first?.querySelector?.("form") ?? null;
  }
}
