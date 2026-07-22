# TW2K Tactical Roadmap

TW2K Tactical is a rules-automation and automatic-modifier engine for Twilight: 2000 4E on Foundry VTT. The T2K4E system remains the document/data authority, while TW2K Tactical derives combat context, explains modifiers, resolves rules, and exposes integration points for action-economy and HUD modules.

## Completed foundation and combat pipeline

- **v0.1–v0.6** — Foundation, rules engine, dice engine, range/combat mode, modifier application, ranged attack workflow.
- **v0.7–v0.10** — Damage, armor, hit locations, critical injuries, death saves, and treatment.
- **v0.11–v0.13** — Foundry actor state and T2K4E adapter integration.
- **v0.14–v0.16** — Combat chat cards, Apply Result actions, permissions, idempotency, and staged application flow.
- **v0.17–v0.18** — Ranged modifiers and modifier-aware staged workflow.
- **v0.19** — Foundry attack dialog and input collection.
- **v0.20** — Live attack controller and hook boundary.
- **v0.21** — Weapon-sheet attack integration.
- **v0.22** — Runtime bootstrap, live service composition, Foundry dice, chat action registration, and production bundle wiring.
- **v0.23** — Foundry V14 / T2K4E compatibility diagnostics and smoke-test hardening.
- **v0.23.1** — Real T2K4E health persistence and persistent Apply Result duplicate protection.
- **v0.23.2** — Synthetic/unlinked token actor persistence using full Foundry actor UUIDs.
- **v0.23.3** — Random hit-location pre-resolution for location-aware armor selection.
- **v0.23.4** — Real T2K4E armor schema compatibility.
- **v0.23.5** — Armor fallback guard for ordinary gear.

## v0.24 — Automatic Combat Context & Modifier Engine

The v0.24 milestone establishes the core automatic-context architecture used by later combat systems.

### v0.24.1–v0.24.4 — Core automatic context

- AttackContext plumbing and explicit override model.
- Real Foundry/T2K4E token and actor context readers.
- Automatic target-prone, target-size, and elevation modifiers.
- Terrain profiles, target-hex modifiers, cover values, blocking terrain, and same-hex terrain exception.
- Scene distance-scale conversion from fine Foundry tactical grids into core 10m T2K combat distance (for example, five 2m Foundry hexes per T2K hex).

### v0.24.5 — Weapon, aiming, and handling context

- Weapon category detection.
- Shotgun range-to-damage rule.
- Quick shot, Fast Aim, and Slow telescopic aim.
- Stable firing platform from prone, bipod, or explicit support.
- Weapon-specific accessory attachment using `flags.tw2k-tactical.attachedWeaponId`.
- Attachment-to-native-property synchronization for supported accessories.
- LMG/GPMG carried-fire penalties.
- Bipod and tripod deployment state.
- HMG tripod/vehicle-mount requirement.
- One-handed firearm restrictions.
- Automatic STR/AGL + Heavy Weapons dice selection for machine-gun support state.
- Real T2K4E `.score` attribute/skill schema and untrained Heavy Weapons support.

### v0.24 completion batch — Remaining Core ranged context

- Automatic combat specialties: Rifleman, Sidearms, Sniper, Archer, Machinegunner, Launcher Crew, Redleg, Vehicle Gunner.
- Defenseless target in same hex (+3) and active/aware same-hex exclusivity.
- Called-shot provider migration.
- Target movement and moving-vehicle-fire provider migration.
- Helpers / NPC group attack support (+1 each, maximum +3).
- Partial/full-cover context and directional-effect override.
- Cover armor application to protected hit locations.
- Automatic full/partial-cover status detection.
- Darkness, weather, smoke, night-vision, thermal-optics, and visibility-limit context.
- Hard LOS gating from Foundry sight collision, blocking terrain, visibility limits, and structured TW2K Tactical flags.
- Structured movement/environment flags where Foundry state cannot prove historical state without guessing.
- Modifier provenance (`automatic`, `inferred`, `input`) surfaced in combat chat.
- Illegal support-state validation.
- Final Core ranged-modifier responsibility audit.

### v0.24 automation policy

TW2K Tactical follows this rule for every context fact:

1. Automatically known → apply automatically.
2. Reliably inferable → apply and explain the reason.
3. Not reliably knowable → expose a manual input with a neutral default.
4. Never silently guess.

Historical movement, directional cover, and map-specific environmental facts can be supplied through structured `flags.tw2k-tactical.*` values until a dedicated state tracker or scene authoring UI owns them.

## v0.25 — Ammo, RoF & Reloads

- Ammo-dice selection limited by weapon RoF and the rounds remaining.
- Slow telescopic aim prevents ammo-die use.
- Ammo-success allocation between damage and additional hits.
- Magazine/belt expenditure persisted before chat publication, with stale-state protection.
- Reload actions on weapon sheets.
- Automatic Reloader-specialty handling.
- Legacy and otherwise untracked weapons remain on the existing v0.24 path.

## Next combat milestones

- **v0.26 — Push, Reliability & Jams**
  - Push rerolls.
  - Ammo-die push behavior.
  - Reliability loss.
  - Weapon jams and clearing jams.
- **v0.27 — Suppression, CUF, Friendly Fire & Overwatch**
- **v0.28 — Heavy Weapons, Explosives & Blast**
  - Individual vs hex targeting.
  - Grenades and launchers.
  - Indirect fire and artillery corrections.
  - Blast and area attacks.
- **v0.29 — Melee Modifier Engine**
- **v0.30 — Grapple / Shove / Disarm / Blocking / Retreat**
- **v0.31 — Core Vehicle Combat Automation**

## Foundry ecosystem integration

- **v0.32 — Settings + ApplicationV2 migration**
  - Configurable automation levels.
  - Migrate legacy Dialog/Application APIs before Foundry removes them.
  - Migrate deprecated chat rendering hooks.
- **v0.33 — YZE Combat Action-Economy Integration**
  - Initiative and Fast/Slow action state remain owned by YZE Combat.
  - TW2K Tactical consumes action state instead of duplicating it.
- **v0.34 — Argon Combat HUD Integration**
  - Argon remains the player-facing combat HUD.
  - TW2K Tactical supplies automation/resolution behind actions.
- **v0.35 — Core / Urban Operations / Hostile Waters Interoperability Audit**
  - Compatibility and rules automation only; no redistribution of premium content.

## Release preparation

- **v0.36 — Release Candidate** — UX polish, accessibility, localization, packaging, manifest/update URLs, installation documentation, and final migration/regression checks.
- **v1.0 — Stable**
