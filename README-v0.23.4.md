# TW2K Tactical v0.23.4 — Real T2K4E Armor Schema Compatibility Fix

Apply this incremental patch on top of v0.23.3.

## Why this patch exists

The v0.23.3 Foundry smoke test confirmed that random hit locations are now resolved before armor selection, but real T2K4E 14.0.1 armor still returned Modified armor 0.

The live T2K4E 14.0.1 item schema observed in Foundry is:

- equipped: `system.equipped`
- armor rating: `system.rating.value`
- coverage:
  - `system.location.head`
  - `system.location.arms`
  - `system.location.torso`
  - `system.location.legs`

TW2K Tactical uses the singular hit-location value `arm`, so this patch explicitly maps it to T2K4E's plural `arms` field.

The existing legacy armor adapter remains as a fallback for items that do not match the observed T2K4E 14.0.1 schema.

## Expected smoke-test results

Using the Soviet Officer test actor:

- Flak Jacket: torso rating 1
- Soviet SSH-68: head rating 1
- Plate Vest: torso rating 2

Expected results with weapon armor modifier 0:

- Head hit: Modified armor 1
- Torso hit: highest body layer is 2 (Plate Vest; Flak Jacket does not stack)
- Arm hit: Modified armor 0
- Legs hit: Modified armor 0

## Install and validate

```bash
unzip -o TW2K-Tactical-v0.23.4-Real-T2K4E-Armor-Schema-Compatibility-Fix.zip -d /workspaces/TW2K-Tactical
cd /workspaces/TW2K-Tactical

npx tsc --noEmit
npm run build
npm test
```

Then rebuild/reload Foundry and repeat the head/torso/arm/legs armor smoke test.
