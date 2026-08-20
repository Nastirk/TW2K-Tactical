type UnknownRecord = Record<string, unknown>;

export interface FoundryModuleCapability {
  active: boolean;
  version?: string;
}

export interface FoundryOfficialAttackCapabilities {
  officialT2K4E: {
    active: boolean;
    version?: string;
    rollAttackAvailable: boolean;
  };
  yzeCombat: FoundryModuleCapability;
  argonT2K: FoundryModuleCapability;
}

export class FoundryIntegrationCapabilityService {
  constructor(
    private readonly getGame: () => unknown,
    private readonly getConfig: () => unknown = () =>
      (globalThis as unknown as UnknownRecord).CONFIG,
  ) {}

  inspect(): FoundryOfficialAttackCapabilities {
    const game = asRecord(this.getGame());
    const system = asRecord(game?.system);
    const systemId = readString(system?.id);

    const itemDocumentClass = asRecord(
      asRecord(this.getConfig())?.Item,
    )?.documentClass as {
      prototype?: unknown;
    } | undefined;
    const prototype = asRecord(
      itemDocumentClass?.prototype,
    );

    return {
      officialT2K4E: {
        active: systemId === "t2k4e",
        version: readVersion(system),
        rollAttackAvailable:
          typeof prototype?.rollAttack ===
            "function",
      },
      yzeCombat:
        this.readModule(game, "yze-combat"),
      argonT2K:
        this.readModule(
          game,
          "enhancedcombathud-t2k4e",
        ),
    };
  }

  private readModule(
    game: UnknownRecord | null,
    moduleId: string,
  ): FoundryModuleCapability {
    const modules = game?.modules as {
      get?(id: string): unknown;
    } | undefined;
    const module = asRecord(
      modules?.get?.(moduleId),
    );

    return {
      active: module?.active === true,
      version: readVersion(module),
    };
  }
}

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object"
    ? value as UnknownRecord
    : null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0
    ? value
    : undefined;
}

function readVersion(
  source: UnknownRecord | null,
): string | undefined {
  return readString(source?.version) ??
    readString(asRecord(source?.data)?.version);
}
