# TW2K Tactical v0.19 – Foundry Attack Dialog & Input Collection

This milestone adds the first attack-input collection layer for the Foundry UI.

Implemented:
- Attack dialog input model.
- HTML form renderer.
- Form-data parser.
- Validation for ranged-combat modifier inputs.
- Translation from dialog input into v0.18 modifier-aware staged attack requests.
- Foundry dialog abstraction.
- Foundry attack dialog service.
- Tests for rendering, parsing, validation, and request construction.

Supported input fields:
- Aim mode
- Called shot
- Target prone
- Full cover / approximate target location known
- Target moved
- Firing from moving vehicle
- Target size
- Elevated firing position
- Terrain modifier
- Light level
- Weather modifier
- Dense smoke
- Night vision
- Thermal optics
- Carried machine gun
- One-handed shooting
- Short-range flag
- Telescopic sight
- Stable platform

This milestone deliberately separates form collection from rules resolution.
The v0.18 modifier resolver remains the authority on whether the attack is legal
and what modifier values apply.

Merge `src` and `tests` into the current project, then run:

```bash
npx tsc --noEmit
npm run build
npm test
```
