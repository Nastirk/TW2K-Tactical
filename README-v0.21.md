# TW2K Tactical v0.21 — Weapon Sheet / Item Integration

This milestone adds a Foundry item-sheet integration layer for launching TW2K Tactical attacks from weapon sheets.

Implemented:
- Request-scoped weapon attack selection source.
- Weapon attack launcher reusing the v0.20 live attack controller.
- Foundry item-sheet hook registration.
- jQuery-compatible weapon-sheet adapter.
- Duplicate-button protection.
- Tests for selection, launching, adapter behavior, and hook registration.

Flow:
Weapon sheet -> Tactical Attack button -> actor + weapon captured -> current target resolved -> v0.20 live attack controller -> v0.19 attack dialog -> staged combat flow.

After extracting, run:
npx tsc --noEmit
npm run build
npm test
