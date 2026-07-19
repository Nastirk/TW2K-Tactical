# TW2K Tactical v0.10 – Death Saves & Critical Injury Treatment

This milestone adds workflow logic for lethal critical injuries.

Implemented:
- Death-save state model.
- Death-save interval tracking: round, stretch, shift.
- Immediate death-save trigger when a lethally injured character moves.
- Medical Aid stabilization progression:
  round -> stretch -> shift -> stabilized.
- Failed stabilization attempt does not improve the time limit.
- Instant-death critical injuries bypass death-save workflow.
- Structured resolver results suitable for later Foundry automation.

Not yet included:
- Actual STAMINA dice rolls for death saves.
- Scheduling/automation timers in Foundry.
- Applying character conditions or actor updates.
- Full Medical Aid gear modifiers.

Merge `src` and `tests` into the current project, then run:

```bash
npx tsc --noEmit
npm run build
npm test
```
