import {
  describe,
  expect,
  it,
} from "vitest";
import {
  FoundryIntegrationCapabilityService,
} from "../../../src/foundry/runtime/foundry-integration-capabilities";

describe("FoundryIntegrationCapabilityService", () => {
  it("detects official T2K4E, rollAttack, YZE Combat, and Argon T2K", () => {
    class OfficialItem {
      rollAttack(): void {}
    }

    const modules = new Map([
      ["yze-combat", {
        active: true,
        version: "1.7.0",
      }],
      ["enhancedcombathud-t2k4e", {
        active: true,
        version: "3.0.0",
      }],
    ]);
    const capabilities =
      new FoundryIntegrationCapabilityService(
        () => ({
          system: {
            id: "t2k4e",
            version: "14.0.2",
          },
          modules,
        }),
        () => ({
          Item: {
            documentClass: OfficialItem,
          },
        }),
      ).inspect();

    expect(capabilities).toEqual({
      officialT2K4E: {
        active: true,
        version: "14.0.2",
        rollAttackAvailable: true,
      },
      yzeCombat: {
        active: true,
        version: "1.7.0",
      },
      argonT2K: {
        active: true,
        version: "3.0.0",
      },
    });
  });

  it("reports unavailable optional integrations without throwing", () => {
    expect(
      new FoundryIntegrationCapabilityService(
        () => ({
          system: {
            id: "t2k4e",
            data: { version: "14.0.1" },
          },
          modules: new Map(),
        }),
        () => ({ Item: {} }),
      ).inspect(),
    ).toMatchObject({
      officialT2K4E: {
        active: true,
        version: "14.0.1",
        rollAttackAvailable: false,
      },
      yzeCombat: { active: false },
      argonT2K: { active: false },
    });
  });
});
