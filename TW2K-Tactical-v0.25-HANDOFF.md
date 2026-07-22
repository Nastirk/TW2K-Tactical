# TW2K Tactical v0.25 Handoff

## Outcome

v0.25 Ammo, RoF & Reloads is implemented on the supplied complete repository. Release metadata is `0.5.2-alpha`. Existing weapons without the recognized T2K4E magazine schema remain on the unchanged v0.24 attack path.

## Source baseline

- Uploaded archive: `TW2K-Tactical-main(2).zip`
- Uploaded archive SHA-256: `07893777d88b79dbf682c1d56e4c0ca66ac98476a9243727d0f8c4b2150f2f6f`
- Baseline release metadata: `0.5.1-alpha`
- Baseline verification: 59 test files / 184 tests passed; Vite production build passed.

## Implemented behavior

### Ammo dice and RoF

- Legal ammo dice are capped at `min(RoF, rounds remaining - 1)`.
- Empty tracked weapons cannot attack.
- One remaining round permits an attack with zero ammo dice.
- Slow telescopic aim permits zero ammo dice only, enforced by both dialog validation and the core modifier-aware workflow/ammo resolver.
- Ammo D6s and their successes are kept separate from the base step-dice hit roll.
- Ammo successes can be allocated to primary-hit damage or reserved/reported for manual additional-hit resolution.
- Reserved successes do not increase primary-target damage.

### Expenditure and persistence

- Zero ammo dice spend one round.
- Nonzero ammo dice spend one plus the sum of their D6 results.
- Expenditure is capped at the rounds loaded.
- Remaining ammunition persists to the loaded item at `system.ammo.value` before the chat card is published.
- Persistence verifies that the loaded value still equals the pre-roll value, preventing stale concurrent expenditure.
- Chat cards report ammo rolls, successes, allocation, rounds spent, rounds remaining, and empty state.

### Reload and Reloader

- Weapon sheets expose **TW2K Tactical Reload** through legacy and ApplicationV2 item-sheet hooks.
- Reload candidates must be actor-owned, non-empty, caliber-compatible, and magazine/belt-capacity-compatible.
- System-created ammunition without `system.itemType` is accepted only through a narrow caliber-bearing name fallback.
- Reload rolls use AGL + Ranged Combat.
- The Reloader specialty is detected automatically and adds +1.
- Success costs a fast action; failure costs a slow action when one remains.
- A failed roll with no slow action available is forfeited and leaves `system.mag.target` unchanged.
- Completed reloads update `system.mag.target` and publish a reload chat card.
- The module API exposes `reload(attackerActor, weapon)`.

## Compatibility and scope

- Target remains Foundry VTT V14 and T2K4E 14.0.1.
- Recognized official fields are weapon `system.rof`, `system.mag.target`, `system.mag.max`, and `system.ammo`; ammunition `system.ammo.value`, `system.ammo.max`, and `system.itemType` when present.
- Push, reliability, and jams remain v0.26.
- Suppression, CUF, friendly fire, and overwatch remain v0.27.
- Automatic additional-target resolution is not guessed.
- YZE Combat remains the future action-economy owner at v0.33; v0.25 asks whether a slow action remains when resolving reload failure.
- No premium rules content is included.

## Verification

`npm run verify` passed:

- TypeScript: passed.
- Vitest: 65 test files / 212 tests passed.
- Vite build: passed; 72 modules transformed.
- Production bundle: `dist/tw2k-tactical.js`, 69.54 kB (18.94 kB gzip).

The suite covers the ammo-dice cap, one-round and D6 expenditure, empty-magazine handling, slow-aim rejection, separated ammo successes, damage/additional-hit allocation, official schema parsing, stale-state persistence, persistence-before-publication ordering, reload action costs, Reloader +1, candidate filtering, failed fast-only reload forfeiture, sheet hooks, and module API exposure.

A live Foundry GUI was not available in the build environment. Complete the environment-specific checklist in `README-v0.25.md` before starting v0.26.

## Next milestone

After the live smoke test, continue with v0.26 Push, Reliability & Jams. Keep v0.27–v1.0 pending according to `docs/Roadmap.md`.
