# TW2K Tactical v0.7 – Damage, Armor & Hit Location

Milestone scaffold for post-hit resolution.

Adds three isolated components:
- HitLocationResolver
- ArmorResolver
- DamageResolver

This package is intentionally conservative: it establishes typed, testable orchestration without hard-coding unverified rulebook tables. Exact hit-location tables, armor behavior, ammunition effects, critical thresholds, and weapon-specific damage data should be supplied by the rules/data layer.

Merge `src` and `tests` into the current clean project, then run:

```bash
npx tsc --noEmit
npm run build
npm test
```
