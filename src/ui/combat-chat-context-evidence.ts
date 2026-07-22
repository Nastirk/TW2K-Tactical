import type { AttackContext } from "../combat/attack-context";
import type { CombatChatEvidenceView } from "./combat-chat-card-types";

function yesNo(value: boolean | undefined): string {
  return value ? "Yes" : "No";
}

function formatNumber(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatMeasurementSource(
  source:
    | "foundry-path"
    | "hex-coordinate-fallback"
    | "pixel-fallback",
): string {
  switch (source) {
    case "foundry-path":
      return "Foundry grid path";
    case "hex-coordinate-fallback":
      return "Foundry hex coordinates";
    case "pixel-fallback":
      return "Pixel-distance fallback";
  }
}

export function buildCombatChatContextEvidence(
  context: AttackContext,
): CombatChatEvidenceView[] {
  const cover = context.targetInFullCover
    ? "Full"
    : context.targetInPartialCover
      ? "Partial"
      : "None";
  const grid = context.combatGridEvidence;

  const distanceEvidence: CombatChatEvidenceView[] = [];

  if (grid) {
    distanceEvidence.push(
      {
        label: "Foundry tactical grid",
        value: `${formatNumber(grid.foundryMetersPerGridSpace)} m per hex`,
      },
      {
        label: "Foundry grid steps",
        value: formatNumber(grid.foundryGridSteps),
      },
      {
        label: "Foundry tactical distance",
        value: `${formatNumber(grid.foundryDistanceMeters)} m`,
      },
      {
        label: "T2K distance conversion",
        value: `${formatNumber(grid.foundrySpacesPerT2KHex)} Foundry hexes = ${formatNumber(grid.t2kMetersPerCombatHex)} m`,
      },
      {
        label: "Distance measurement",
        value: formatMeasurementSource(grid.measurementSource),
      },
    );
  }

  distanceEvidence.push(
    {
      label: "T2K combat distance",
      value: `${context.distanceHexes} ${context.distanceHexes === 1 ? "hex" : "hexes"}`,
    },
    {
      label: "Same T2K 10m hex",
      value: yesNo(context.sameHex),
    },
  );

  return [
    ...distanceEvidence,
    {
      label: "Range band",
      value: context.rangeBand ?? "—",
    },
    {
      label: "Target terrain",
      value: context.targetTerrain ?? "None",
    },
    {
      label: "Target defenseless",
      value: yesNo(context.targetDefenseless),
    },
    {
      label: "Cover",
      value: cover,
    },
    {
      label: "Cover effective against attacker",
      value: yesNo(context.coverEffectiveAgainstAttacker),
    },
    {
      label: "Approx. target location known",
      value: yesNo(context.approximateTargetLocationKnown),
    },
    {
      label: "Target moved",
      value: yesNo(context.targetMoved),
    },
    {
      label: "Firing from moving vehicle",
      value: yesNo(context.firingFromMovingVehicle),
    },
    {
      label: "Dense smoke",
      value: yesNo(context.denseSmoke),
    },
    {
      label: "Night vision effective",
      value: yesNo(context.hasNightVision),
    },
    {
      label: "Thermal optics",
      value: yesNo(context.hasThermalOptics),
    },
    {
      label: "Line of sight blocked",
      value: yesNo(context.lineOfSightBlocked),
    },
  ];
}
