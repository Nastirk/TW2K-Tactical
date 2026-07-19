# TW2K Tactical v0.6 – Ranged Attack Workflow

This milestone adds an orchestration layer for ranged attacks.

It connects:

RangedAttackRequest
→ AttackContextBuilder
→ Modifier providers
→ Net modifier
→ DiceModifierApplicator
→ DiceEngine
→ RangedAttackResult

This milestone does NOT yet apply:
- damage
- armor
- hit location
- critical injuries

Merge `src` and `tests` into your clean v0.5.1 project, then run:

```bash
npx tsc --noEmit
npm run build
npm test
```
