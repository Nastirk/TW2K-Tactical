# TW2K Tactical v0.11 – Foundry Actor State Integration

This milestone connects the pure combat rules to an actor-state persistence layer
without hard-coding Twilight: 2000 system document paths into the core rules.

Implemented:
- Actor combat-state model.
- ActorCombatStateRepository abstraction.
- ActorStateService for applying:
  - damage
  - incapacitation
  - critical injuries
  - death-save state
- FoundryActorCombatStateRepository adapter.
- Configurable Foundry actor data paths.
- Safe nested-path reading/writing.
- Unit tests for state transitions and Foundry adapter behavior.

The default Foundry data paths are intentionally configurable because exact actor
schema paths can vary by Twilight: 2000 system version.

Merge `src` and `tests` into the current project, then run:

```bash
npx tsc --noEmit
npm run build
npm test
```
