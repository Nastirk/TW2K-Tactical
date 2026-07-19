# TW2K Tactical

A Foundry VTT module foundation for rules-accurate Twilight: 2000 4th Edition tactical combat automation.

## Current milestone: v0.5.1 alpha

Implemented foundations:

- TypeScript + Vite module build
- Foundry module bootstrap and Roll adapter
- Step-die pool and dice engine
- TW2K dice modifier applicator
- Attack request/context model
- Combat mode separation (`ranged` / `close-combat`)
- Weapon SHORT range measured in 10-meter hexes
- Short / Medium / Long / Extreme / out-of-range calculation
- Range modifiers
- Same-hex firearm modifiers
- Unit tests

## Development

```bash
npm install
npx tsc --noEmit
npm run build
npm test
```

Generated dependencies and build output are intentionally excluded from Git.
