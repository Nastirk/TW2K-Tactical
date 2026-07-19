import {
  describe,
  expect,
  it,
} from "vitest";

import {
  CombatChatCardRenderer,
} from "../../src/ui/combat-chat-card-renderer";

describe(
  "CombatChatCardRenderer",
  () => {
    it(
      "renders a hit result with damage and critical injury",
      () => {
        const html =
          new CombatChatCardRenderer()
            .render({
              title:
                "TW2K Tactical Attack",
              attackerName:
                "Ronson",
              targetName:
                "Marauder",
              weaponName:
                "AKM",
              modifiers: [
                {
                  source:
                    "range",
                  value: -1,
                  description:
                    "Range: medium",
                },
              ],
              netModifier: -1,
              baseDice: [
                { sides: 10 },
                { sides: 8 },
              ],
              finalDice: [
                { sides: 8 },
                { sides: 8 },
              ],
              rolledDice: [
                {
                  sides: 8,
                  value: 6,
                },
                {
                  sides: 8,
                  value: 8,
                },
              ],
              successes: 2,
              hit: true,
              hitLocation:
                "torso",
              damageBeforeArmor: 3,
              modifiedArmorLevel: 1,
              finalDamage: 2,
              critical: {
                injury:
                  "Broken ribs",
                lethal: false,
                timeLimit: null,
                effects: [
                  "STAMINA -1",
                  "MOBILITY -1",
                ],
                healTime:
                  "2D6 days",
                instantDeath:
                  false,
              },
              targetActorId:
                "target",
              canApplyResult: true,
            });

        expect(html).toContain(
          "HIT",
        );
        expect(html).toContain(
          "Broken ribs",
        );
        expect(html).toContain(
          "Final damage",
        );
        expect(html).toContain(
          "tw2k-tactical-apply-result",
        );
      },
    );

    it(
      "escapes actor names",
      () => {
        const html =
          new CombatChatCardRenderer()
            .render({
              title: "Attack",
              attackerName:
                "<script>",
              targetName:
                "Target",
              weaponName:
                "Rifle",
              modifiers: [],
              netModifier: 0,
              baseDice: [],
              finalDice: [],
              rolledDice: [],
              successes: 0,
              hit: false,
              canApplyResult:
                false,
            });

        expect(html).not.toContain(
          "<script>",
        );
        expect(html).toContain(
          "&lt;script&gt;",
        );
      },
    );
  },
);
