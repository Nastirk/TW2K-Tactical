# TW2K Tactical v0.14 – Foundry Combat UI & Chat Cards

This milestone adds the first player-facing Foundry presentation layer for the
combat engine.

Implemented:
- Structured combat chat-card view model.
- HTML chat-card renderer.
- Foundry ChatMessage adapter.
- CombatChatService for publishing end-to-end attack results.
- Modifier breakdown.
- Base and final dice display.
- Hit/miss status.
- Damage, hit location, armor, and critical injury display.
- Death-save warning display.
- Optional "Apply Result" action metadata for later interactive automation.
- Basic module CSS.
- Unit tests.

The adapter deliberately wraps Foundry ChatMessage creation behind a small
interface so the combat engine remains independently testable and future
Foundry API changes stay isolated.

Foundry v14 still exposes ChatMessage documents and ChatMessage.create-style
document creation patterns; module-owned metadata is stored under flags.

## Install

Merge `src`, `tests`, and `styles` into the current project.

Ensure `module.json` loads:

```json
"styles": [
  "styles/tw2k-tactical.css"
]
```

Then run:

```bash
npx tsc --noEmit
npm run build
npm test
```
