# TW2K Tactical v0.23.1 — Real T2K4E Health Persistence Fix

This patch is based on the first live Foundry V14.359 + T2K4E 14.0.1 smoke test.

## Fixed

- Maps tactical accumulated damage onto T2K4E's real visible HP field: `system.health.value`.
- Uses `system.health.max` as the default T2K4E hit-capacity source.
- Derives tactical damage as `max HP - current HP`, ignoring the stale `system.health.damage` value written by v0.23.
- Clamps visible HP at zero when damage exceeds hit capacity.
- Keeps optional direct damage-path support for non-T2K4E/custom integrations.
- Honors the persisted `flags.tw2k-tactical.applied` flag so the same result stays protected after a runtime reload.
- Ensures a result is not marked applied when actor persistence throws.
- Converts duplicate Apply Result failures into a friendly Foundry warning instead of an unhandled promise rejection.

## Live regression target

With a T2K4E actor at 5 HP, applying 2 damage through a TW2K Tactical chat result should update:

`system.health.value: 5 -> 3`

and the visible actor-sheet HP should show 3 after application.

## Development checks

```bash
npx tsc --noEmit
npm run build
npm test
```
