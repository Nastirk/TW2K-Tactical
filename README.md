# TW2K Tactical v0.8 – Rules-Accurate Post-Hit Resolution

This milestone updates the v0.7 post-hit foundation to match the verified
Twilight: 2000 4E Player's Manual rules.

Implemented:
- D6 hit-location table: 1 Legs, 2–4 Torso, 5 Arm, 6 Head.
- Optional chosen hit location for called shots / aimed blows.
- Damage = weapon base damage + 1 per extra success beyond the first.
- Highest applicable body-armor layer only.
- Body armor may combine with one external armor source (cover or vehicle armor).
- Weapon armor modifier applies to armor only when armor is present.
- Modified armor reduces damage.
- Penetration limit: an attack is fully deflected when modified armor is at
  least 2 higher than weapon base damage.
- Armor-ablation check flag when armor is penetrated.
- Critical injury trigger based on post-mitigation damage.
- Severe critical injury dice count:
  * threshold reached: 1D10
  * threshold +2: 2D10 keep highest
  * threshold +4: 3D10 keep highest
  * and so on.
- PostHitResolver orchestration.

The detailed critical-injury tables remain a separate future data layer.

Merge `src` and `tests` into the current project, then run:

```bash
npx tsc --noEmit
npm run build
npm test
```
