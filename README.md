# TW2K Tactical v0.12 – End-to-End Combat Workflow

This milestone connects the existing tested combat components into one orchestrated ranged attack flow:

Ranged attack
→ attack context
→ modifiers
→ modified dice pool
→ dice roll
→ hit / miss
→ post-hit resolution
→ critical injury table roll
→ death-save state
→ actor-state persistence

Implemented:
- EndToEndRangedCombatWorkflow
- Structured workflow result
- Miss handling
- Hit handling
- Post-hit damage/armor integration
- Critical injury roll integration
- Actor damage persistence
- Critical injury persistence
- Death-save state persistence
- Tests for miss, normal hit, critical hit, and actor-state updates

This milestone still leaves UI/chat cards and real Twilight: 2000 Foundry data-path mapping for later milestones.

Merge `src` and `tests` into the current project, then run:

```bash
npx tsc --noEmit
npm run build
npm test
```
