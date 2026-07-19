# Dice Engine

The Dice Engine is intentionally independent from Foundry.

## Responsibilities
- Represent step dice
- Build dice pools
- Roll through an injected roller
- Return structured results
- Count successes

## Current success model
- 6–9: 1 success
- 10–12: 2 successes

This is isolated so the rule can be changed centrally if required.

## Next step
Add a Foundry adapter that implements `DieRoller` using Foundry's `Roll` API.
