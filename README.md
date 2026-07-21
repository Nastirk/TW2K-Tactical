# TW2K Tactical

> Tactical combat automation for **Twilight: 2000 4th Edition** on Foundry Virtual Tabletop.

![Verify](https://github.com/Nastirk/TW2K-Tactical/actions/workflows/verify.yml/badge.svg)

TW2K Tactical is a Foundry VTT module focused on **rules automation, automatic combat context, and transparent modifier calculation** for the Twilight: 2000 4E game system.

The goal is simple:

> The player chooses an action and a target. TW2K Tactical calculates every modifier it can from the current Foundry state, explains where each modifier came from, and leaves uncertain information visible and overrideable.

TW2K Tactical is designed to complement—not replace—the T2K4E system, Year Zero Engine combat tools, or combat HUD modules.

---

## Current Development Status

**Active development milestone:** `v0.24 — Automatic Combat Context & Modifier Engine` (completion candidate)

Current development branch:

```text
codex/v0.24-auto-modifier-engine
```

Recent validated work includes:

- Real T2K4E actor, weapon, armor, and token integration
- Foundry V14 runtime/bootstrap wiring
- Persistent health and synthetic-token actor updates
- Real T2K4E armor schema compatibility
- Automatic range modifiers
- Same-hex firearm rules
- Automatic prone-target detection
- Automatic target-size modifiers
- Automatic elevation modifiers
- Terrain and hex context
- Configurable Foundry tactical sub-grid converted into core 10m T2K combat distance
- Forest / foliage terrain modifiers
- Same-hex terrain exception
- Shotgun range-to-damage behavior
- Quick shot / Fast Aim / Slow telescopic aim handling
- Scope, bipod, and tripod accessory attachment
- Weapon-specific accessory gating
- Automatic prone stable-platform detection
- LMG / GPMG carried-fire penalties
- Bipod and tripod deployment state
- Real T2K4E Heavy Weapons dice schema compatibility
- Automatic Core combat-specialty modifiers
- Defenseless-target same-hex rule
- Cover status, directional-effect input, and cover armor
- Darkness, weather, smoke, night vision, thermal optics, and visibility limits
- Hard line-of-sight gating and blocking terrain
- Structured movement-state automation
- Helpers and NPC group attack bonuses
- Modifier provenance in combat chat
- Unified local verification command
- GitHub Actions verification workflow

Development is ongoing and APIs, flags, and UI may still change before `v1.0`.

---

## Design Principles

TW2K Tactical follows four modifier rules:

1. **Automatically known** → apply automatically.
2. **Reliably inferable** → apply and show the reason.
3. **Not reliably knowable** → request player input.
4. **Never silently guess.**

Every combat result should make the modifier chain visible:

```text
Foundry / T2K4E state
        ↓
AttackContext
        ↓
Independent modifier providers
        ↓
Transparent modifier breakdown
        ↓
Net modifier
        ↓
Final step-dice pool
```

---

## Current Combat Automation

### Automatic context

TW2K Tactical keeps Foundry positioning separate from the core game's 10m combat abstraction. A Scene may use a finer tactical grid—for example **2m per Foundry hex**—while ranged-combat distance is converted into complete **10m T2K combat hexes**.

With a 2m Scene grid, five Foundry grid steps equal one T2K combat hex:

```text
0–4 Foundry hexes  = 0 T2K hexes (same combat hex)
5–9 Foundry hexes  = 1 T2K hex
10–14 Foundry hexes = 2 T2K hexes
```

This supports more immersive token positioning without making an 8m separation count as four T2K range hexes. Combat chat context evidence reports the Foundry grid scale, measured steps, tactical distance in metres, and the converted T2K combat distance.

TW2K Tactical can currently derive or use:

- Attacker and target token positions
- Range band
- Same-hex state
- Target prone state
- Target size
- Relative elevation
- Tagged terrain
- Weapon category
- Shotgun-specific range behavior
- Equipped and attached weapon accessories
- Attacker prone state for stable firing support
- Machine-gun class and support state

### Automatic ranged modifiers

| Rule | Status |
|---|---|
| Short / Medium / Long / Extreme range | Implemented |
| Same-hex active/aware firearm penalty | Implemented |
| Defenseless target in same hex | Implemented |
| Target prone | Implemented |
| Large / small target | Implemented |
| Elevated firing position | Implemented |
| Terrain modifiers / same-hex exception | Implemented |
| Quick shot / Fast Aim / Slow telescopic aim | Implemented |
| Stable firing platform | Implemented |
| Shotgun range exception | Implemented |
| LMG / GPMG carried penalties | Implemented |
| Bipod / tripod deployment | Implemented |
| HMG support requirements | Implemented |
| One-handed weapon restrictions | Implemented |
| Core ranged/heavy-weapon specialties | Implemented |
| Called shot | Implemented |
| Target movement | Implemented with automatic flag/manual override |
| Firing from moving vehicle | Implemented with automatic flag/manual override |
| Partial / full cover | Implemented |
| Cover armor | Implemented for protected hit locations |
| Darkness / weather / smoke | Implemented |
| Night vision / thermal optics | Implemented |
| Visibility-limit / hard LOS blocking | Implemented |
| Helpers / NPC group attacks | Implemented, max +3 |
| Modifier provenance | Implemented |

---

## Weapon Accessories

TW2K Tactical adds weapon-specific accessory attachment support.

Compatible gear can be attached to a specific weapon using:

```text
flags.tw2k-tactical.attachedWeaponId
```

This prevents one accessory from automatically benefiting every compatible weapon owned by the actor.

Examples:

```text
Telescopic Sight
└── Attached to: M16A1

Bipod
└── Attached to: M240B

Tripod
└── Attached to: M240B
```

Attachment and deployment are intentionally separate concepts:

```text
Accessory attached  ≠  Accessory deployed
```

A bipod or tripod may be attached to a weapon while not currently deployed in combat.

---

## Terrain

TW2K Tactical supports structured terrain context through Foundry state rather than guessing from map artwork.

Canonical terrain flag:

```text
flags["tw2k-tactical"].terrainType
```

Supported terrain types currently include:

- Pavement
- Field
- Shrubland
- Debris
- Forest
- Foliage
- Swamp
- Shallows
- Blocking
- Indoors

Terrain can be supplied by tagged Foundry Regions, with token flags available as a fallback/testing path.

Other context that Foundry cannot reliably infer from a single current-state snapshot can be authored with structured flags, including:

```text
flags.tw2k-tactical.coverEffectiveAgainstAttacker
flags.tw2k-tactical.coverArmorLevel
flags.tw2k-tactical.movedSincePreviousTurn
flags.tw2k-tactical.firingFromMovingVehicle
flags.tw2k-tactical.lightLevel
flags.tw2k-tactical.weatherModifier
flags.tw2k-tactical.visibilityLimitHexes
flags.tw2k-tactical.lineOfSightBlocked
flags.tw2k-tactical.denseSmoke
flags.tw2k-tactical.helperCount
```

These flags are transparent fallbacks for facts that should not be guessed from map artwork or historical movement that Foundry does not natively retain.

---

## Ecosystem Role

TW2K Tactical is intended to work alongside the existing Foundry ecosystem:

### T2K4E Foundry System

The T2K4E system remains the authority for:

- Actors
- Items
- Weapons
- Armor
- Vehicles
- Character data
- Native document schemas

### Year Zero Engine: Combat

YZE Combat should remain the authority for:

- Initiative
- Fast actions
- Slow actions
- Action-economy state

TW2K Tactical can integrate with that state rather than duplicating it.

### Argon Combat HUD

Argon remains the player-facing combat HUD.

TW2K Tactical should provide combat automation and modifier resolution behind the action instead of creating a competing combat toolbar.

---

## Roadmap

High-level development plan:

```text
v0.24  Automatic Combat Context & Modifier Engine
v0.25  Ammo, RoF & Reloads
v0.26  Push, Reliability & Jams
v0.27  Suppression, CUF, Friendly Fire & Overwatch
v0.28  Heavy Weapons, Explosives & Blast
v0.29  Melee Modifier Engine
v0.30  Grapple / Shove / Disarm / Blocking / Retreat
v0.31  Core Vehicle Combat Automation
v0.32  Settings + ApplicationV2 migration
v0.33  YZE Combat Action-Economy Integration
v0.34  Argon Combat HUD Integration
v0.35  Core / Urban Operations / Hostile Waters Interoperability Audit
v0.36  Release Candidate
v1.0   Stable
```

---

## Development

### Requirements

- Node.js 20+
- npm
- Foundry VTT V14
- Twilight: 2000 4E system

### Install dependencies

```bash
npm ci
```

### Verify everything

```bash
npm run verify
```

This runs:

```text
TypeScript type-check
Vitest test suite
Vite production build
```

### Build only

```bash
npm run build
```

Output:

```text
dist/tw2k-tactical.js
```

---

## Continuous Integration

Pushes to `main` and `codex/**` branches, plus pull requests targeting `main`, run the verification workflow automatically.

The CI pipeline checks:

- TypeScript
- Tests
- Production build

Live Foundry smoke tests are still required for runtime behavior that cannot be fully reproduced in unit tests.

---

## Compatibility

Current development target:

```text
Foundry VTT: V14
T2K4E system: 14.0.1
```

The module currently uses some Foundry V1 application APIs that remain available in V14 but are scheduled for removal in later Foundry versions.

Migration to ApplicationV2 is on the roadmap before those APIs are removed.

---

## Project Direction

TW2K Tactical is not intended to redistribute premium Twilight: 2000 content.

Rules automation is implemented from compatible runtime state and user-owned system/module content.

Planned compatibility audits include:

- Core Set
- Urban Operations
- Hostile Waters

Expansion support will focus on interoperability and rules automation without bundling premium content.

---

## Contributing

Development is currently moving in small validated slices:

```text
Implement
→ npm run verify
→ targeted Foundry smoke test
→ commit
→ push
```

Bug reports should ideally include:

- Foundry version
- T2K4E system version
- Weapon/item involved
- Relevant actor/token state
- TW2K Tactical modifier breakdown
- Browser console error, when present

---

## License & Disclaimer

TW2K Tactical is an unofficial community project.

Twilight: 2000 and related names and materials belong to their respective rights holders. This project is not affiliated with or endorsed by Free League Publishing.

No premium rulebook, compendium, or expansion content is distributed with TW2K Tactical.
