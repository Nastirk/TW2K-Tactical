# TW2K Tactical v0.18 – Modifier-Aware Staged Attack Flow

This milestone wires the v0.17 ranged-combat modifier rules into the staged attack pipeline.

Flow:

Foundry/UI combat facts
→ resolve additional ranged modifiers
→ reject impossible shots
→ inject modifiers into RangedAttackResolver
→ resolve staged attack
→ publish/review/apply through the existing v0.16 flow

Implemented:
- Static modifier provider adapter.
- Modifier-aware staged ranged combat workflow.
- Attack-blocked error with a rules reason.
- Additional v0.17 modifiers are applied to the actual dice pool, not just displayed.
- Existing range and same-hex providers can remain in the base provider list.
- Tests for modifier injection, impossible shots, and modifier breakdown.

The v0.17 modifier resolver deliberately does not duplicate range-band or same-hex firearm
modifiers; those remain handled by the existing providers.

Merge `src` and `tests` into the project, then run:

```bash
npx tsc --noEmit
npm run build
npm test
```
