# TW2K Tactical v0.23 — Foundry V14 / T2K4E Smoke-Test Hardening

This milestone hardens the now-live runtime integration before adding more combat rules.

## Added

- T2K4E runtime compatibility diagnostics.
- Module API diagnostics via:
  `game.modules.get("tw2k-tactical").api.diagnostics()`
- Explicit compatibility checks for the active `t2k4e` system.
- Pre-attack validation for attacker, target, and weapon IDs.
- Pre-attack validation that the selected item is a weapon.
- Exactly-one-target enforcement.
- Error notifications for compatibility or dialog-collection failures.
- Weapon-sheet support for both legacy jQuery rendering and DOM/ApplicationV2-style rendering.
- Registration for both `renderItemSheet` and `renderItemSheetV2` hooks.
- Ready-time compatibility logging.
- Expanded runtime and sheet integration tests.

## Manual Foundry smoke test

1. Enable TW2K Tactical in a Twilight: 2000 4E world.
2. Open the browser developer console.
3. Run:

   `game.modules.get("tw2k-tactical").api.diagnostics()`

4. Confirm `systemId` is `t2k4e` and `ok` is `true`.
5. Place an attacker and a target token on the active scene.
6. Target exactly one token.
7. Open a ranged weapon item sheet owned by the attacker.
8. Confirm the `TW2K Tactical Attack` button appears.
9. Click it and confirm the attack dialog opens.
10. Submit the attack and confirm a staged combat chat card is created.
11. Use `Apply Result` and verify the target actor is updated only once.

## Development checks

Run after extracting:

```bash
npx tsc --noEmit
npm run build
npm test
```

The production bundle should remain materially larger than the old 0.28 kB logging-only bundle.
