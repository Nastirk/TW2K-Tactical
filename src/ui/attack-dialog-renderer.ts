import type { AttackDialogInput } from "./attack-dialog-types";

export class AttackDialogRenderer {
  render(initial: AttackDialogInput): string {
    const ammunitionHtml =
      initial.ammoTracked
        ? `
        <fieldset class="tw2k-tactical-attack-dialog__ammo">
          <legend>Ammunition</legend>
          <div class="form-group">
            <label>Ammo dice</label>
            <input
              type="number"
              name="ammoDice"
              min="0"
              max="${initial.maxAmmoDice ?? 0}"
              step="1"
              value="${initial.ammoDice ?? 0}"
            />
            <p class="notes">
              Maximum ${initial.maxAmmoDice ?? 0};
              ${initial.roundsRemaining ?? 0} rounds loaded.
            </p>
          </div>
          <div class="form-group">
            <label>Ammo-success allocation</label>
            <select name="ammoSuccessAllocation">
              ${this.option(
                "damage",
                "Apply to damage",
                initial.ammoSuccessAllocation ?? "damage",
              )}
              ${this.option(
                "additional-hits",
                "Reserve for additional hits",
                initial.ammoSuccessAllocation ?? "damage",
              )}
            </select>
          </div>
        </fieldset>`
        : "";

    return `
      <form class="tw2k-tactical-attack-dialog">
        <div class="form-group">
          <label>Aim Mode</label>
          <select name="aimMode">
            ${this.option("quick", "Quick shot", initial.aimMode)}
            ${this.option("fast", "Fast aim", initial.aimMode)}
            ${this.option("slow", "Slow telescopic aim", initial.aimMode)}
          </select>
        </div>

        ${this.checkbox("calledShot", "Called shot", initial.calledShot)}
        ${this.checkbox("targetProne", "Target prone", initial.targetProne)}
        ${this.checkbox("targetInFullCover", "Target in full cover", initial.targetInFullCover)}
        ${this.checkbox("approximateTargetLocationKnown", "Approximate target location known", initial.approximateTargetLocationKnown)}
        ${this.checkbox("targetMoved", "Target moved since previous turn", initial.targetMoved)}
        ${this.checkbox("firingFromMovingVehicle", "Firing from moving vehicle", initial.firingFromMovingVehicle)}
        ${this.checkbox("elevatedPosition", "Elevated firing position", initial.elevatedPosition)}
        ${this.checkbox("denseSmoke", "Dense smoke", initial.denseSmoke)}
        ${this.checkbox("hasNightVision", "Night vision", initial.hasNightVision)}
        ${this.checkbox("hasThermalOptics", "Thermal optics", initial.hasThermalOptics)}
        ${this.checkbox("machineGunCarried", "Machine gun fired while carried", initial.machineGunCarried)}
        ${this.checkbox("oneHanded", "One-handed shooting", initial.oneHanded)}
        ${this.checkbox("atShortRange", "At short range", initial.atShortRange)}
        ${this.checkbox("hasTelescopicSight", "Telescopic sight", initial.hasTelescopicSight)}
        ${this.checkbox("stablePlatform", "Stable firing platform", initial.stablePlatform)}

        <div class="form-group">
          <label>Target Size</label>
          <select name="targetSize">
            ${this.option("normal", "Normal", initial.targetSize)}
            ${this.option("large", "Large", initial.targetSize)}
            ${this.option("small", "Small", initial.targetSize)}
          </select>
        </div>

        <div class="form-group">
          <label>Target Terrain Modifier</label>
          <select name="targetTerrainModifier">
            ${this.option("0", "0", String(initial.targetTerrainModifier))}
            ${this.option("-1", "-1", String(initial.targetTerrainModifier))}
            ${this.option("-2", "-2", String(initial.targetTerrainModifier))}
          </select>
        </div>

        <div class="form-group">
          <label>Light Level</label>
          <select name="lightLevel">
            ${this.option("normal", "Normal", initial.lightLevel)}
            ${this.option("dim", "Dim light", initial.lightLevel)}
            ${this.option("dark", "Darkness", initial.lightLevel)}
            ${this.option("total-darkness", "Total darkness", initial.lightLevel)}
          </select>
        </div>

        <div class="form-group">
          <label>Weather Modifier</label>
          <input type="number" name="weatherModifier" max="0" step="1" value="${initial.weatherModifier}" />
        </div>

        ${ammunitionHtml}
      </form>
    `;
  }

  private checkbox(name: string, label: string, checked: boolean): string {
    return `
      <div class="form-group">
        <label>
          <input type="checkbox" name="${name}" ${checked ? "checked" : ""} />
          ${label}
        </label>
      </div>
    `;
  }

  private option(value: string, label: string, selected: string): string {
    return `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`;
  }
}
