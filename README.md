# TW2K Tactical v0.5 – Dice Modifier Applicator

Merge the `src` and `tests` directories into the current consolidated module.

This milestone adds a pure dice-pool modifier applicator for TW2K step dice.

After merging, run:

```bash
npx tsc --noEmit
npm run build
npm test
```

The implementation:
- Uses D6 → D8 → D10 → D12 step dice.
- Applies positive steps to the lower die first.
- Applies negative steps to the higher die first.
- Drops a die when stepped below D6.
- Allows positive modifiers to add a D6 when a one-die pool can be improved further.
- Caps the pool at two D12s.
