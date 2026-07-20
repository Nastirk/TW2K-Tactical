# TW2K Tactical Roadmap

## Completed foundation and ranged-combat pipeline

- v0.1–v0.6: Foundation, rules engine, dice engine, range/combat mode, modifier application, ranged attack workflow.
- v0.7–v0.10: Damage, armor, hit locations, critical injuries, death saves, and treatment.
- v0.11–v0.13: Foundry actor state and T2K4E adapter integration.
- v0.14–v0.16: Combat chat cards, Apply Result actions, permissions, idempotency, and staged application flow.
- v0.17–v0.18: Additional ranged modifiers and modifier-aware staged workflow.
- v0.19: Foundry attack dialog and input collection.
- v0.20: Live attack controller and hook boundary.
- v0.21: Weapon-sheet attack integration.
- v0.22: Runtime bootstrap, live service composition, Foundry dice, chat action registration, and production bundle wiring.
- v0.23: Foundry V14 / T2K4E compatibility diagnostics and smoke-test hardening.
- v0.23.1: Live T2K4E health persistence fix, persistent Apply Result duplicate protection, and friendlier action errors.
- v0.23.2: Synthetic/unlinked token actor persistence using full Foundry actor UUIDs.
- v0.23.3: Random hit-location pre-resolution for location-aware T2K4E armor selection, preventing normal random-hit attacks from bypassing body armor.

## Next combat milestones

- v0.24 — Ammunition, rate of fire, reloads, and ammo consumption.
- v0.25 — Push mechanics and reroll consequences.
- v0.26 — Suppression and CUF-related combat effects.
- v0.27 — Explosives, blast power, and area attacks.
- v0.28 — Melee combat workflow.
- v0.29 — Grappling and special close-combat actions.

## Foundry feature integration

- v0.30 — Module settings and configurable automation levels.
- v0.31 — Combat tracker and action-economy integration.
- v0.32 — Active effects and status-condition integration.
- v0.33 — Full Foundry/T2K4E integration regression and compatibility test suite.

## Release preparation

- v0.34 — UX polish, accessibility, localization cleanup, Foundry ApplicationV2/dialog migration, renderChatMessageHTML migration, and error messaging.
- v0.35 — Release candidate, packaging, manifest/update URLs, installation documentation, and final migration checks.
- v1.0 — Stable release.
