# TW2K Tactical contribution guide

## Project overview

TW2K Tactical is a Foundry VTT module written in TypeScript. The module manifest is `module.json`; Vite bundles source files into the distributable module.

## Repository layout

- `src/`: TypeScript source. `src/main.ts` is the module entry point.
- `tests/`: Vitest test suite.
- `styles/`: Module CSS.
- `lang/`: Foundry localization JSON files.
- `docs/`: project documentation and release notes.
- `module.json`: Foundry manifest. Keep its identifiers, versions, and asset paths in sync with releases.

## Commands

Install dependencies with `npm install`.

- `npm run build` — production Vite build.
- `npm test` — run the test suite once.
- `npm run test:watch` — run tests in watch mode.
- `npm run verify` — run TypeScript checking, tests, and a production build. Use this before handing off a change when practical.

## Working conventions

- Keep TypeScript strict; do not weaken `tsconfig.json` settings to bypass errors.
- Make focused changes and preserve the existing module APIs and Foundry hooks unless a deliberate compatibility change is required.
- Add or update tests in `tests/` whenever behavior changes.
- Prefer localization keys and `lang/` updates over hard-coded player-facing strings.
- Update `module.json` only when the module metadata, assets, compatibility, or release version actually changes.
- Do not commit generated build output, dependencies, secrets, or local Foundry data unless the repository explicitly tracks them.

## Validation and handoff

Before finishing, review `git diff`, run the narrowest relevant tests, and run `npm run verify` for broader changes. State any validation that could not be run and why.
