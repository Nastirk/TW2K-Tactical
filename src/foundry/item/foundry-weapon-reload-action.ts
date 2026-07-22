import {
  ReloadResolver,
  type ReloadResult,
} from "../../combat/reload-resolver";
import {
  DiceModifierApplicator,
} from "../../dice/modifier-applicator";
import {
  DiceEngine,
  type DieRoller,
} from "../../dice/roller";
import {
  escapeHtml,
} from "../../ui/html-escape";
import {
  FoundryChatMessagePublisher,
} from "../chat/foundry-chat-message-publisher";
import type {
  FoundryChatMessageClassLike,
} from "../chat/foundry-chat-types";
import type {
  FoundryNotificationSink,
} from "../combat/foundry-live-attack-types";
import type {
  FoundryDialogClassLike,
} from "../dialog/foundry-dialog-types";
import {
  T2K4EActorAdapter,
} from "../t2k4e/t2k4e-actor-adapter";
import {
  T2K4EAmmunitionAdapter,
  type T2KReloadCandidate,
} from "../t2k4e/t2k4e-ammunition-adapter";
import type {
  T2K4EActorLike,
  T2K4EItemLike,
} from "../t2k4e/t2k4e-types";

interface ReloadDialogSelection {
  ammunitionItemId: string;
  hasSlowActionAvailable: boolean;
}

interface FormDataLike {
  get(name: string): unknown;
}

export class FoundryWeaponReloadAction {
  constructor(
    private readonly Dialog:
      FoundryDialogClassLike,
    private readonly ChatMessage:
      FoundryChatMessageClassLike,
    private readonly dieRoller:
      DieRoller,
    private readonly notifications:
      FoundryNotificationSink,
    private readonly ammunitionAdapter =
      new T2K4EAmmunitionAdapter(),
  ) {}

  async launch(
    attackerActor: unknown,
    weaponDocument: unknown,
  ): Promise<boolean> {
    try {
      const actor =
        attackerActor as
          T2K4EActorLike;
      const weapon =
        weaponDocument as
          T2K4EItemLike;
      const candidates =
        this.ammunitionAdapter
          .getReloadCandidates(
            actor,
            weapon,
          );

      if (candidates.length === 0) {
        this.notifications.warn(
          "No compatible non-empty ammunition is available for this weapon.",
        );
        return false;
      }

      const selection =
        await this.collectSelection(
          candidates,
        );

      if (!selection) {
        return false;
      }

      const candidate =
        candidates.find(
          (entry) =>
            entry.ammunitionItemId ===
            selection.ammunitionItemId,
        );

      if (!candidate) {
        throw new Error(
          "The selected ammunition is no longer available.",
        );
      }

      const actorAdapter =
        new T2K4EActorAdapter(
          actor,
        );
      const hasReloaderSpecialty =
        actorAdapter
          .hasSpecialty(
            "Reloader",
          );
      const result =
        await new ReloadResolver(
          new DiceEngine(
            this.dieRoller,
          ),
          new DiceModifierApplicator(),
        ).resolve({
          attributeDie:
            actorAdapter
              .getAttributeDie(
                "agl",
              ),
          skillDie:
            actorAdapter
              .getSkillDie(
                "rangedCombat",
              ),
          hasReloaderSpecialty,
          hasSlowActionAvailable:
            selection
              .hasSlowActionAvailable,
        });

      if (result.completed) {
        if (
          typeof weapon.update !==
          "function"
        ) {
          throw new Error(
            "The weapon cannot be updated.",
          );
        }

        await weapon.update({
          "system.mag.target":
            candidate
              .ammunitionItemId,
        });
      }

      await this.publishResult(
        actor,
        weapon,
        candidate,
        result,
        hasReloaderSpecialty,
      );

      return result.completed;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Reload failed.";

      this.notifications.error?.(
        message,
      );
      return false;
    }
  }

  private collectSelection(
    candidates:
      T2KReloadCandidate[],
  ): Promise<
    ReloadDialogSelection | null
  > {
    return new Promise(
      (resolve) => {
        let settled = false;
        const finish = (
          value:
            ReloadDialogSelection | null,
        ) => {
          if (settled) {
            return;
          }
          settled = true;
          resolve(value);
        };

        const options =
          candidates.map(
            (candidate) =>
              `<option value="${escapeHtml(candidate.ammunitionItemId)}">${escapeHtml(candidate.name)} (${candidate.roundsRemaining}/${candidate.capacity})</option>`,
          ).join("");

        const dialog =
          new this.Dialog({
            title:
              "TW2K Tactical Reload",
            content: `
              <form class="tw2k-tactical-reload-dialog">
                <div class="form-group">
                  <label>Ammunition</label>
                  <select name="reloadAmmunitionItemId">${options}</select>
                </div>
                <div class="form-group">
                  <label>
                    <input type="checkbox" name="hasSlowActionAvailable" checked />
                    Slow action is available if the reload roll fails
                  </label>
                </div>
              </form>
            `,
            buttons: {
              reload: {
                label: "Reload",
                callback: (html) => {
                  const form =
                    this.extractFormData(
                      html,
                    );
                  const ammunitionItemId =
                    form.get(
                      "reloadAmmunitionItemId",
                    );

                  if (
                    typeof ammunitionItemId !==
                    "string" ||
                    ammunitionItemId.length ===
                      0
                  ) {
                    throw new Error(
                      "Select ammunition to reload.",
                    );
                  }

                  const slowAction =
                    form.get(
                      "hasSlowActionAvailable",
                    );

                  finish({
                    ammunitionItemId,
                    hasSlowActionAvailable:
                      slowAction === true ||
                      slowAction === "true" ||
                      slowAction === "on",
                  });
                },
              },
              cancel: {
                label: "Cancel",
                callback: () =>
                  finish(null),
              },
            },
            default: "reload",
            close: () =>
              finish(null),
          });

        dialog.render(true);
      },
    );
  }

  private extractFormData(
    html: unknown,
  ): FormDataLike {
    if (
      html &&
      typeof html === "object" &&
      "formData" in html
    ) {
      return (
        html as {
          formData: FormDataLike;
        }
      ).formData;
    }

    const root =
      html as {
        querySelector?:
          (selector: string) => unknown;
        find?:
          (selector: string) =>
            ArrayLike<unknown>;
        0?: {
          querySelector?:
            (selector: string) => unknown;
        };
      };
    const form =
      root?.querySelector?.("form") ??
      root?.find?.("form")?.[0] ??
      root?.[0]
        ?.querySelector?.("form");

    if (
      !form ||
      typeof FormData ===
        "undefined"
    ) {
      throw new Error(
        "Unable to read reload dialog form data.",
      );
    }

    return new FormData(
      form as HTMLFormElement,
    );
  }

  private async publishResult(
    actor: T2K4EActorLike,
    weapon: T2K4EItemLike,
    candidate: T2KReloadCandidate,
    result: ReloadResult,
    hasReloaderSpecialty: boolean,
  ): Promise<void> {
    const dice =
      result.roll.rolls
        .map(
          (roll) =>
            `d${roll.sides}: ${roll.value}`,
        )
        .join(", ") || "—";
    const outcome =
      result.completed
        ? `Reloaded; ${result.actionCost} action used.`
        : "Reload failed; no slow action available, so the attempt was forfeited.";

    await new FoundryChatMessagePublisher(
      this.ChatMessage,
    ).publish({
      attackerActor: actor,
      content: `
        <article class="tw2k-tactical-card tw2k-tactical-card--reload">
          <h3>TW2K Tactical Reload</h3>
          <p>${escapeHtml(actor.name ?? "Actor")} reloads ${escapeHtml(weapon.name ?? "Weapon")} with ${escapeHtml(candidate.name)}.</p>
          <p>Roll: ${escapeHtml(dice)}${hasReloaderSpecialty ? " (+1 Reloader)" : ""}</p>
          <p>Successes: <strong>${result.roll.successes}</strong></p>
          <p><strong>${escapeHtml(outcome)}</strong></p>
        </article>
      `,
    });
  }
}
