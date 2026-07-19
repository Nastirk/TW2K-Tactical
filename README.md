# TW2K Tactical v0.5.1 – Dice Modifier Rules Fix

This patch corrects the dice-step modifier behavior.

Rules implemented:
- With only one base die, the first positive step adds a D6.
- Positive modifiers then step up the lower die first.
- Negative modifiers step down the higher die first.
- Stepping below two D6 removes one die.
- The pool can never be reduced below one D6.
- The pool can never exceed two D12s.

Merge the included `src` and `tests` folders into your current project.

Then run:

```bash
npx tsc --noEmit
npm run build
npm test
```
