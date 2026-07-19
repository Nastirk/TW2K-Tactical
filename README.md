# TW2K Tactical v0.17 – Additional Ranged Combat Modifiers

This milestone expands rules-accurate ranged combat modifiers from the Twilight: 2000 4E Player's Manual.

Implemented:
- Quick shot:
  - pistols/carbines/SMGs: -1
  - other ranged weapons: -2
- Fast aim: no modifier
- Telescopic slow aim:
  - +1 normally
  - +2 from a stable platform
- Target prone outside same hex: -1
- Full cover with known approximate position: -3
- Called shot: -2
- Moving target: -1
- Firing from a moving vehicle: -2
- Large target: +2
- Small target: -2
- Elevated firing position: +1
- Target-hex terrain modifier: 0 to -2
- Dim light: -1
- Darkness: -2
- Heavy rain / fog / strong wind: configurable, typically -1
- Dense smoke with known target hex: -3
- Total darkness and unknown targets in dense smoke can block the attack
- Night vision can negate darkness
- Thermal optics can negate darkness, weather, and smoke
- Machine-gun carried-fire penalties
- One-handed firearm penalties and rifle/assault-rifle short-range restriction
- Full modifier breakdown and attack-allowed result

Existing range-band and same-hex providers remain separate so their logic is not counted twice.

Verified rules basis:
- Player's Manual ranged-fire modifier table.
- Aiming and telescopic sights.
- Full/partial cover.
- Moving targets and moving vehicles.
- Target size and elevation.
- Terrain, weather, darkness, and smoke.
- Machine guns and one-handed shooting.

Merge `src` and `tests` into the current project, then run:

```bash
npx tsc --noEmit
npm run build
npm test
```
