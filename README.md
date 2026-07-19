# TW2K Tactical v0.9 – Critical Injury Tables & Resolution

This milestone adds location-specific critical injury data and resolution.

Implemented:
- D10 critical-injury tables for Head, Torso, Arms, and Legs.
- Severe critical injuries roll multiple D10s and keep the highest.
- Structured injury outcomes:
  - injury name
  - lethal flag
  - death-save time limit
  - effects
  - healing time
  - instant-death flag
- Automatic arm-critical effect: drop held items.
- Automatic leg-critical effect: fall down.
- CriticalInjuryTableResolver for deterministic/testable table lookup.
- CriticalInjuryRollResolver for rolling the correct number of D10s.

This milestone leaves death-save scheduling and Medical Aid stabilization for a later workflow layer.

Merge `src` and `tests` into the current project, then run:

```bash
npx tsc --noEmit
npm run build
npm test
```
