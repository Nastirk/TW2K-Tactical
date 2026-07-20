import type { AttackDialogInput } from "./attack-dialog-types";

export class AttackDialogRenderer {
  render(initial: AttackDialogInput): string {
    return `
      <form class="tw2k-tactical-attack-dialog">
        <div class="form-group">
          <label>Aim Mode</label>
          <select name="aimMode">
            ${this.option("quick", "Quick shot", initial.aimMode)}
            ${this.option("fast", "Fast aim", initial.aimMode)}
            ${initial.hasTelescopicSight
              ? this.option("slow", "Slow telescopic aim", initial.aimMode)
              : ""}
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
        ${this.oneHandedControl(initial)}
        <input type="hidden" name="machineGunCarried" value="${initial.machineGunCarried}" />
        <input type="hidden" name="atShortRange" value="${initial.atShortRange}" />
        <input type="hidden" name="hasTelescopicSight" value="${initial.hasTelescopicSight}" />
        <input type="hidden" name="attackerProne" value="${initial.attackerProne ?? false}" />
        <input type="hidden" name="hasBipod" value="${initial.hasBipod}" />
        ${initial.hasBipod
          ? this.checkbox("bipodDeployed", "Bipod deployed", initial.bipodDeployed)
          : ""}
        <input type="hidden" name="hasTripod" value="${initial.hasTripod}" />
        ${initial.hasTripod
          ? this.checkbox("tripodDeployed", "Tripod deployed", initial.tripodDeployed)
          : ""}
        <input type="hidden" name="vehicleMounted" value="${initial.vehicleMounted}" />
        ${this.checkbox("stablePlatform", "Other stable firing platform", initial.stablePlatform)}

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
      </form>
    `;
  }

  private oneHandedControl(initial: AttackDialogInput): string {
    switch (initial.weaponCategory) {
      case "pistol":
      case "smg":
      case "carbine":
      case "rifle":
      case "assault-rifle":
        return this.checkbox(
          "oneHanded",
          "One-handed shooting",
          initial.oneHanded,
        );
      default:
        return '<input type="hidden" name="oneHanded" value="false" />';
    }
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
