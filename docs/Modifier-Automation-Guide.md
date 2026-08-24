# Building Twilight: 2000 4E modifier automation

This guide describes a safe, incremental route for extending TW2K Tactical into a transparent modifier calculator for Twilight: 2000 4E. It is written for the existing module: TypeScript source in `src/`, Vitest tests in `tests/`, and Foundry VTT/T2K4E documents as the live game-state source.

The goal is not to make the module silently decide every rules question. The goal is to calculate every fact Foundry can know, show each applied modifier, and ask the player or GM about facts the game state cannot establish.

## The result to aim for

For every action, produce an `AttackContext`, pass it through independent modifier providers, and render an auditable result:

```text
Selected action + Foundry state + explicit choices
                    |
                    v
             AttackContext facts
                    |
                    v
          modifier / legality providers
                    |
                    v
  final dice pool + visible modifier breakdown
```

Each displayed entry needs a numeric value, a short explanation, a source reference, and its provenance:

- `automatic`: read directly from a Foundry document or tracked module state.
- `inferred`: derived from multiple reliable facts, such as grid distance.
- `input`: chosen in the action dialog because it cannot be known reliably.

This mirrors the module's existing automation policy: automatic where known, input where uncertain, and never silently guessed.

## Step 1: Define the scope and release slices

Do not attempt all modifier rules in one release. Create a rule inventory from the two books, then divide it by action type and implementation priority.

Start with this scope order:

1. Ranged combat: range, target state, terrain, visibility, weapon handling, cover, aim, movement, and helpers.
2. Ranged-combat exceptions: support weapons, specialty rules, target-size and same-hex exceptions.
3. Melee: position, weapon, target state, environmental, and action rules.
4. Vehicle, blast, artillery, suppression, travel, and campaign rules.

For every inventory item, choose exactly one status:

| Status | Meaning |
| --- | --- |
| `automate` | The needed facts are present or can be tracked safely. |
| `input` | The rule applies, but its facts need a player or GM decision. |
| `defer` | It needs an action workflow, system API, or UI that does not yet exist. |
| `exclude` | It is setting/advice/scenario content rather than executable mechanics. |

Treat the book extracts as working notes, not as the module's runtime source. Have a licensed owner verify each rule's wording, applicability, printed page, and errata before it becomes executable. Store concise, original descriptions and page/section pointers rather than reproducing book passages in module data.

## Step 2: Convert the rule extracts into structured rule cards

Create one record per independently testable rule. The existing `src/rule-data/` catalog is the appropriate source of truth for declarative rules; providers should consume typed facts, not parse prose or PDFs.

Use a consistent card before writing code:

```ts
type ModifierRuleCard = {
  id: string;                    // e.g. "combat.ranged.target-prone"
  action: "ranged" | "melee" | "vehicle";
  effect: "step-dice" | "blocked" | "damage" | "armor";
  value?: number;
  conditions: string[];          // named facts, never book prose
  exceptions: string[];
  source: { book: string; page: number; section: string };
  automation: "automatic" | "inferred" | "input";
};
```

For example, a prone-target rule might have named conditions such as `target.isProne` and `!combat.sameHex`. The provider turns those facts into a `Modifier`; it does not decide how a token became prone or inspect the rule book.

Use stable, domain-prefixed IDs. Existing examples include `target-prone`, `same-hex-firearm`, and `terrain`. Stable IDs make tests, migrations, localization, override settings, and chat-card provenance reliable.

## Step 3: Establish a controlled vocabulary

Before importing map or book data, define the values the module accepts. Avoid allowing arbitrary labels such as `woods`, `Trees`, and `forest 2` to reach rules code.

Initial vocabularies should include:

- Terrain: the existing `pavement`, `field`, `shrubland`, `debris`, `forest`, `foliage`, `swamp`, `shallows`, `blocking`, and `indoors` values.
- Cover: `none`, `partial`, `full`, plus a direction/effectiveness state.
- Visibility: light level, weather, smoke, and visibility distance.
- Tokens: prone, size, elevation, current movement state, and defenseless.
- Weapons: category, range bands, accessory attachment, weapon support, and vehicle mounting.
- Action choices: aim mode, called shot, one-handed use, and manual overrides.

Keep game rules separate from presentation text. Add player-facing labels to `lang/en.json`, and retain compact machine values in TypeScript/data files.

## Step 4: Turn recreated battlemap data into authored terrain regions

Do not attempt to determine terrain by analysing map-image pixels at attack time. The recreated map layout is excellent source material, but it must be reviewed and converted to Foundry-authored data.

The existing `battlemap-01-terrain-layout.json` already supplies a useful intermediate representation: scene dimensions/grid data and labelled terrain shapes. Use this workflow for each map:

1. Verify the background image, grid type, grid size, distance, and offset against the actual Foundry Scene.
2. Review every generated shape in the layout file against the original map. Correct edge cases manually, especially roads, buildings, water, and dense vegetation.
3. Convert each shape into a Foundry Region (or the module's compatible scene geometry) and set `flags.tw2k-tactical.terrainType` to one controlled terrain value.
4. Assign an explicit priority where shapes overlap. A road, building, or blocking object must win over the base field layer where appropriate.
5. Mark blocking geometry and line-of-sight behaviour separately from terrain modifiers. Forest might affect a modifier, while a wall can block a shot.
6. Test token centres and token footprints on region borders. Document the chosen rule (normally the token centre) and make it consistent.
7. Export/import the scene and keep the source layout JSON under version control so corrections are reproducible.

The live context reader should ask Foundry which tagged Region contains the target (and, where needed, attacker or line of fire), then use a token flag as a fallback for tests and un-authored scenes. It should never rely on the name of a Tile or on image colours.

## Step 5: Build one complete context pipeline

Create an action-specific context builder at the Foundry boundary. It reads Foundry/T2K4E documents once and emits typed facts. It must not apply rules.

For a ranged action, include at least:

```ts
type RangedAttackContext = {
  attacker: { prone: boolean; elevation: number; specialties: string[] };
  target: { prone: boolean; size: string; elevation: number; terrain: string };
  distance: { foundrySteps: number; metres: number; combatHexes: number };
  sight: { blocked: boolean; visibilityLimitHexes?: number };
  cover: { level: "none" | "partial" | "full"; effective?: boolean };
  weapon: { category: string; rangeBands: unknown; accessories: string[] };
  environment: { light: string; weather?: number; smoke: string };
  choices: { aimMode: string; calledShot: boolean; overrides: unknown[] };
};
```

Use the current combat-grid conversion: fine Foundry movement can remain, but range rules convert it to complete 10m T2K combat hexes. Include raw distance and the converted distance in chat evidence so a player can spot a bad Scene grid configuration.

For historical facts that a snapshot cannot prove—such as whether a target moved since its last turn—track a small module-owned state record from combat hooks, or leave the fact as a neutral dialog input. Do not infer it from a token's current coordinates alone.

## Step 6: Add one provider per rule family

Providers are deliberately small and independent. The module already has this structure in `src/rules/providers/` for terrain, range, prone targets, elevation, target movement, cover, specialties, visibility, and weapon handling.

For each new family:

1. Add named facts to the typed context.
2. Implement a provider that returns zero or more `Modifier` objects, or a clear blocked-action result.
3. Register it once in the modifier registry/composition root.
4. Add a unit test for normal application, each exception, and a no-op case.
5. Add a resolver/integration test proving the modifier reaches the final dice pool and chat-card breakdown.

Keep the following responsibilities distinct:

- **Context reader:** “the target is in a forest Region.”
- **Provider:** “forest changes this specific ranged attack by this amount.”
- **Legality check:** “this action cannot be attempted.”
- **Dice applicator:** “apply the final net step-die change.”
- **UI:** “show why and let a permitted person override an uncertain fact.”

This prevents duplicate modifiers and avoids the legacy risk where both `RangedCombatModifierResolver` inputs and a live provider apply the same rule.

## Step 7: Make uncertainty explicit in the attack dialog

Every dialog choice needs a neutral default and a visible source. A helpful layout is:

- **Calculated:** distance, range band, terrain, target prone/size, attached accessories, and stable support.
- **Needs confirmation:** directional cover, historical movement, exact weather severity, target awareness, helper participation, and map-specific effects.
- **GM override:** a reason plus a modifier or blocked-action decision.

When a manual value replaces or supplements an automatic value, preserve both in the chat result. For example: “Target movement: -1 (GM confirmed; automatic tracking unavailable).” Never hide an automation override behind a final total.

Provide module settings for automation level if groups have different tastes: `advisory` (calculate but do not apply), `confirm` (pre-fill dialog), and `automatic` (apply reliable facts). Keep GM override available at all levels.

## Step 8: Test the rules as a matrix

The test suite should be the executable record of the extracted logic. Add tests beside the existing provider and combat workflow tests.

For every rule, cover:

1. The ordinary case.
2. Each stated exception.
3. A boundary value (same hex, range-band edge, region edge, maximum helpers).
4. Interaction with at least one other modifier.
5. An invalid or blocked action when applicable.
6. Provenance and player-facing explanation.

Use data-driven tables for combinations, but retain one readable example per rule. Add map integration fixtures that place tokens on representative terrain Regions, rather than testing only raw terrain strings.

Run the narrow provider test while developing, then run:

```powershell
npm run verify
```

This performs strict TypeScript checking, all Vitest tests, and a production Vite build.

## Step 9: Release in playable increments

For each release slice:

1. Publish the rule inventory rows included and excluded.
2. Add/adjust typed data, context facts, provider(s), localization, and tests.
3. Test a real T2K4E actor, weapon, linked token, and synthetic/unlinked token.
4. Test a Scene with the normal 10m grid and one with the tactical sub-grid.
5. Review a combat chat card with a player and GM: the total should be easy to challenge and diagnose.
6. Review `git diff`, run `npm run verify`, and record known manual inputs.
7. Update the roadmap and release notes only for the behaviour actually delivered.

## Suggested first two milestones

The current project is already well into the first milestone. Finish it before adding wider systems.

### Milestone A: dependable ranged modifier engine

- Finish the Core ranged-rule inventory and source verification.
- Complete terrain Region import/review for the recreated battlemap(s).
- Close remaining range, terrain, visibility, cover, movement, and exception tests.
- Add action-dialog confirmation and chat evidence for every non-automatic fact.

### Milestone B: reusable modifier platform

- Extract shared concepts (context facts, provenance, source references, overrides, modifier breakdown rendering) from ranged combat.
- Add a separate melee context and providers; do not force melee through ranged-only types.
- Add vehicles/blast only when their action lifecycle and target geometry are represented explicitly.

## Definition of done for a modifier

A rule is complete only when it has:

- a verified source page/section and a stable rule ID;
- controlled inputs and documented automation level;
- a provider or legality check with no duplicate path;
- localization for player-facing text;
- unit, interaction, and workflow coverage;
- a visible chat-card explanation; and
- a defined fallback when Foundry cannot know the fact.

Following this definition keeps the system credible at the table: players can trust the automation because they can see both the evidence and the limits of what it knows.

