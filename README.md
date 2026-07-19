# TW2K Tactical v0.16 – Staged Foundry Attack Flow

This milestone aligns the combat engine, chat cards, and interactive Apply Result action
into one consistent Foundry-facing workflow:

Resolve attack
→ Produce staged combat result
→ Publish chat card
→ Review result
→ Click Apply Result
→ Persist damage / critical injury / death-save state

Implemented:
- StagedEndToEndRangedCombatWorkflow (no immediate actor mutation).
- CombatResultPayloadFactory.
- StagedFoundryRangedAttackService.
- Chat payload now contains the complete staged actor-update data.
- Interactive Apply Result path consumes the staged payload.
- Immediate-mutation v0.12 workflow remains available for non-UI/internal use.
- Unit tests for staged miss, staged hit, critical injury payload, and chat publication.

This milestone intentionally separates:
- rules resolution
- presentation
- persistence

That separation prevents actor state from being updated twice.

Merge `src` and `tests` into the current project, then run:

```bash
npx tsc --noEmit
npm run build
npm test
```
