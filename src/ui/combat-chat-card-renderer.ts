import type {
  CombatChatCardViewModel,
} from "./combat-chat-card-types";
import {
  escapeHtml,
} from "./html-escape";

export class CombatChatCardRenderer {
  render(
    model:
      CombatChatCardViewModel,
  ): string {
    const modifierRows =
      model.modifiers.length > 0
        ? model.modifiers
            .map(
              (modifier) => `
                <li>
                  <span>${escapeHtml(
                    modifier.description,
                  )}${modifier.provenance
                    ? ` <small class="tw2k-tactical-card__provenance">(${escapeHtml(modifier.provenance)})</small>`
                    : ""}</span>
                  <strong>${this.formatModifier(
                    modifier.value,
                  )}</strong>
                </li>`,
            )
            .join("")
        : "<li>No modifiers</li>";

    const evidenceHtml =
      model.evidence && model.evidence.length > 0
        ? `
          <details class="tw2k-tactical-card__evidence" open>
            <summary><strong>Context evidence</strong></summary>
            <dl>
              ${model.evidence
                .map(
                  (entry) => `
                    <dt>${escapeHtml(entry.label)}</dt>
                    <dd>${escapeHtml(entry.value)}</dd>`,
                )
                .join("")}
            </dl>
          </details>`
        : "";

    const criticalHtml =
      model.critical
        ? `
          <section class="tw2k-tactical-card__critical">
            <h4>Critical Injury</h4>
            <p><strong>${escapeHtml(
              model.critical.injury,
            )}</strong></p>
            <p>${model.critical.lethal
              ? "Lethal"
              : "Non-lethal"}</p>
            ${model.critical.timeLimit
              ? `<p>Death save: every ${escapeHtml(
                  model.critical.timeLimit,
                )}</p>`
              : ""}
            ${model.critical.healTime
              ? `<p>Heal time: ${escapeHtml(
                  model.critical.healTime,
                )}</p>`
              : ""}
            <ul>
              ${model.critical.effects
                .map(
                  (effect) =>
                    `<li>${escapeHtml(
                      effect,
                    )}</li>`,
                )
                .join("")}
            </ul>
          </section>`
        : "";

    const postHitHtml =
      model.hit
        ? `
          <section class="tw2k-tactical-card__damage">
            <h4>Hit Resolution</h4>
            <dl>
              <dt>Location</dt>
              <dd>${escapeHtml(
                model.hitLocation ??
                  "Unknown",
              )}</dd>

              <dt>Damage before armor</dt>
              <dd>${escapeHtml(
                model.damageBeforeArmor ??
                  0,
              )}</dd>

              <dt>Modified armor</dt>
              <dd>${escapeHtml(
                model.modifiedArmorLevel ??
                  0,
              )}</dd>

              <dt>Final damage</dt>
              <dd>${escapeHtml(
                model.finalDamage ??
                  0,
              )}</dd>
            </dl>
          </section>`
        : "";

    const deathSaveHtml =
      model.deathSaveStatus ===
      "required"
        ? `
          <div class="tw2k-tactical-card__warning">
            Death saves required${
              model.deathSaveTimeLimit
                ? ` every ${escapeHtml(
                    model.deathSaveTimeLimit,
                  )}`
                : ""
            }.
          </div>`
        : model.deathSaveStatus ===
          "dead"
        ? `
          <div class="tw2k-tactical-card__warning">
            Target is dead.
          </div>`
        : "";

    const actionHtml =
      model.canApplyResult &&
      model.targetActorId
        ? `
          <button
            type="button"
            class="tw2k-tactical-card__apply"
            data-action="tw2k-tactical-apply-result"
            data-target-actor-id="${escapeHtml(
              model.targetActorId,
            )}"
          >
            Apply Result
          </button>`
        : "";

    return `
      <article class="tw2k-tactical-card">
        <header>
          <h3>${escapeHtml(
            model.title,
          )}</h3>
          <p>
            ${escapeHtml(
              model.attackerName,
            )}
            attacks
            ${escapeHtml(
              model.targetName,
            )}
            with
            ${escapeHtml(
              model.weaponName,
            )}
          </p>
        </header>

        ${evidenceHtml}

        <section>
          <h4>Modifiers</h4>
          <ul class="tw2k-tactical-card__modifiers">
            ${modifierRows}
          </ul>
          <p>
            Net modifier:
            <strong>${this.formatModifier(
              model.netModifier,
            )}</strong>
          </p>
        </section>

        <section>
          <h4>Dice</h4>
          <p>
            Base:
            ${this.renderDice(
              model.baseDice,
            )}
          </p>
          <p>
            Final:
            ${this.renderDice(
              model.finalDice,
            )}
          </p>
          <p>
            Roll:
            ${this.renderDice(
              model.rolledDice,
            )}
          </p>
          <p>
            Successes:
            <strong>${model.successes}</strong>
          </p>
        </section>

        <div class="tw2k-tactical-card__result tw2k-tactical-card__result--${model.hit ? "hit" : "miss"}">
          ${model.hit ? "HIT" : "MISS"}
        </div>

        ${postHitHtml}
        ${criticalHtml}
        ${deathSaveHtml}
        ${actionHtml}
      </article>
    `;
  }

  private renderDice(
    dice: readonly {
      sides: number;
      value?: number;
    }[],
  ): string {
    if (
      dice.length === 0
    ) {
      return "—";
    }

    return dice
      .map(
        (die) =>
          `<span class="tw2k-tactical-card__die">d${die.sides}${
            die.value !== undefined
              ? `: ${die.value}`
              : ""
          }</span>`,
      )
      .join(" ");
  }

  private formatModifier(
    value: number,
  ): string {
    return value > 0
      ? `+${value}`
      : String(value);
  }
}
