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
          },
        },
        cancel: {
          label: "Cancel",
        },
      },
      default: "attack",
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

    throw new Error("Unable to read attack dialog form data.");
  }
}
