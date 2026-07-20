# TW2K Tactical v0.23.2 — Synthetic Token Actor Persistence Fix

This patch fixes the second issue found during the live Foundry V14.359 + T2K4E 14.0.1 smoke test.

## Root cause

Unlinked Foundry tokens use synthetic Actor documents. A synthetic actor can share the same actor ID as a world/base actor, while its full UUID identifies the exact token actor instance.

The v0.23.1 chat payload stored only `targetActorId`. Apply Result therefore resolved the world actor through `game.actors.get(id)` instead of the synthetic actor currently represented by the targeted token. The chat result was marked applied, but the visible target token stayed at the same HP.

## Fixed

- Captures the targeted actor's full Foundry `uuid` during the live attack flow.
- Persists `targetActorUuid` in the TW2K Tactical combat-result chat payload.
- Keeps `targetActorId` for backward compatibility and linked/world actor fallback.
- Prefers the full actor UUID when applying damage, critical injuries, and death-save state.
- Resolves synthetic actor UUIDs through Foundry's global `fromUuid` API before falling back to `game.actors.get(id)`.
- Prevents a synthetic target from accidentally updating a different world/base actor that shares the same actor ID.
- Preserves compatibility with older chat results that do not contain `targetActorUuid`.
- Adds regression coverage for synthetic actor UUID capture, payload propagation, UUID-based application, and repository resolution.

## Live regression target

For an unlinked/synthetic T2K4E token actor:

```text
Starting HP: 5
Final Damage: 2
Apply Result
Expected visible token HP: 3
```

The chat payload should now contain both:

```json
{
  "targetActorId": "...",
  "targetActorUuid": "Scene.<scene>.Token.<token>.Actor.<actor>",
  "finalDamage": 2
}
```

A second Apply Result must remain blocked without applying damage twice.

## Development checks

```bash
npx tsc --noEmit
npm run build
npm test
```
