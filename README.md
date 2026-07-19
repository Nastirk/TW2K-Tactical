# TW2K Tactical v0.13 – Real TW2K Foundry System Integration

This milestone adds a concrete integration layer for the official Foundry VTT
Twilight: 2000 (4th Edition) system (`t2k4e`).

The official system exposes Character/NPC actors and Weapon/Critical Injury
items, and stores game-system-specific data under Foundry's `system` object.
This milestone keeps the tactical engine independent while adding adapters that
translate official-system actors/items into TW2K Tactical requests.

Implemented:
- Official system guard (`game.system.id === "t2k4e"`).
- TW2K actor/weapon document adapters.
- Attribute + skill step-die extraction with alias support.
- Weapon base damage, crit threshold, armor modifier, and short range extraction.
- Actor hit-capacity/damage extraction.
- Equipped armor lookup by hit location.
- End-to-end request factory for the existing combat workflow.
- Defensive schema validation with useful errors.
- Unit tests with representative official-system document shapes.

Important:
The official T2K4E system has evolved across Foundry versions. The adapter uses
a small ordered set of known/compatible aliases instead of coupling the core
rules to one brittle property path. The extraction layer is the only place that
should need adjustment if the official system changes fields again.

Merge `src` and `tests` into the current project, then run:

```bash
npx tsc --noEmit
npm run build
npm test
```
