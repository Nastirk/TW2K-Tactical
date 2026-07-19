# TW2K Tactical v0.15 – Interactive Foundry Combat Actions

This milestone makes combat chat cards interactive.

Implemented:
- Chat-card action controller.
- "Apply Result" click handling.
- Foundry chat-log listener registration.
- Target actor lookup from card metadata.
- Idempotency guard to prevent double application.
- Permission hook for later GM/user authorization rules.
- Actor-state application service.
- Chat-card button state update after successful application.
- Structured error handling.
- Unit tests.

Important:
The existing v0.12 end-to-end workflow currently persists actor state immediately.
For interactive application, v0.15 introduces a separate staged-result application path
intended for UI-driven use. The next integration step should switch the in-Foundry UI flow
to produce a staged combat result first, then apply it only when the chat-card button is clicked.

Merge `src` and `tests` into the current project, then run:

```bash
npx tsc --noEmit
npm run build
npm test
```
