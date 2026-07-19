# TW2K Tactical v0.22 — Runtime Bootstrap & Foundry Hook Wiring

This milestone turns the previously isolated combat/UI classes into an actual Foundry runtime composition root.

Implemented:
- `src/main.ts` now bootstraps the combat runtime instead of only logging lifecycle hooks.
- Registers the v0.20 live attack hook and v0.21 weapon-sheet attack hook.
- Resolves the current Foundry target from `game.user.targets`.
- Opens the attack dialog through a promise-based adapter.
- Executes the modifier-aware staged ranged combat workflow.
- Uses the real Foundry `Roll` integration already provided by `FoundryDieRoller`.
- Publishes staged combat results to Foundry chat.
- Registers the Apply Result chat listener on `ready`.
- Restricts Apply Result to a GM or an owner of the target actor.
- Exposes `game.modules.get("tw2k-tactical").api.attack()` for runtime/manual invocation.
- Adds runtime token-distance/range-band and weapon-category adapters.
- Improves attack-dialog form extraction for real DOM/jQuery-like Foundry dialog HTML.

Important validation notes:
- T2K4E actor/item field aliases are still inferred and must be checked in a real T2K4E world.
- The runtime assumes the scene grid distance represents one game hex when converting measured scene distance to hexes.
- Same-hex target awareness currently defaults to active/aware because the existing module has no status adapter yet.
- Random hit-location body armor is still limited by the existing request-factory architecture: armor lookup occurs before a random hit location is rolled. This should be corrected in the next combat-integration milestone.

After extracting, run:

```bash
npx tsc --noEmit
npm run build
npm test
```

The production bundle should now be materially larger than the previous ~0.28 kB bundle because `src/main.ts` imports and instantiates the runtime combat graph.
