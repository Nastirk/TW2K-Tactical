# TW2K Tactical v0.23.3 — Hit Location & Armor Integration Fix

This is an incremental patch intended to be applied **on top of v0.23.2**.

## What this fixes

The live T2K4E attack path previously built the combat request before a normal random hit location had been resolved. Since body armor is location-specific, the request factory received no location and returned an empty body-armor list. This could let ordinary random-hit attacks bypass worn armor.

v0.23.3 pre-resolves the normal TW2K D6 hit location before the T2K4E request factory selects armor:

- 1 → Legs
- 2–4 → Torso
- 5 → Arm
- 6 → Head

The resolved location is passed into the existing combat request as `chosenHitLocation`, so the post-hit pipeline reuses the same location and the T2K4E armor adapter can select only armor that protects that location.

The existing armor rules remain unchanged:

- only armor covering the resolved hit location applies;
- the existing armor resolver keeps the highest applicable body-armor layer;
- external/cover armor remains separate and additive;
- v0.23.2 actor UUID persistence and duplicate-result protection are untouched.

## Apply the patch

From the Codespace:

```bash
unzip -o TW2K-Tactical-v0.23.3-Hit-Location-Armor-Integration-Fix.zip -d /workspaces/TW2K-Tactical
cd /workspaces/TW2K-Tactical

npx tsc --noEmit
npm run build
npm test
```

## Recommended Foundry smoke test

Use Foundry V14 with T2K4E 14.0.1.

1. Give the target torso armor (for example a flak jacket or plate vest) and a helmet.
2. Make several normal TW2K Tactical ranged attacks without choosing a called-shot location.
3. Confirm the chat result reports the resolved hit location.
4. On a torso hit, verify torso armor mitigates damage.
5. On a head hit, verify the helmet mitigates damage.
6. On arm/leg hits, verify torso armor and helmets do not incorrectly apply.
7. Repeat against both a linked actor token and an unlinked/synthetic token actor.
8. Confirm Apply Result still changes visible HP and duplicate application is blocked.
9. If using cover/external armor, verify it still combines with the applicable body armor.

## Note

The live path resolves the hidden random hit-location D6 while the attack request is being prepared so location-specific armor can be selected before damage resolution. This is deliberately scoped as a compatibility fix; a later workflow refactor can move location-aware armor selection deeper into the core post-hit pipeline without changing the player-facing result.
