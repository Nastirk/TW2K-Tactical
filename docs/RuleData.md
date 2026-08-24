# Rule data

`src/rule-data/` is the module's source of truth for declarative game rules.
It avoids making services parse player-facing rule text or depend on a PDF at
runtime.

Each `DeclarativeRule` contains:

- a stable `id` for code and migrations;
- `when` predicates over named facts supplied by a resolver;
- atomic `effects` a resolver can apply or schedule; and
- a `source` pointer to the printed page and section in the supplied manual.

`CORE_RULE_CATALOG` contains universal mechanics already normalized from the
Player's Manual. `MANUAL_SOURCE_INDEX` is the conversion backlog and marks
each manual chapter as mechanics, reference data, setting, advice, or a
scenario. Setting and scenario records should be stored as world-content
entities; they must not be incorrectly modelled as executable rules.

`COMBAT_TERRAIN_DATA` and `TRAVEL_TERRAIN_DATA` deliberately remain separate:
the former is for 10 metre combat hexes, while the latter controls movement
and encounters in 10 kilometre travel hexes. `WEAPON_DATA` uses numeric
fields for every reusable table stat (reliability, rate of fire, damage,
critical threshold, range, magazine, armour modifier, encumbrance, and
price). Traits cover non-numeric exceptions such as disposable launchers and
smoke grenades.

`CHARACTER_RULE_CATALOG`, `VEHICLE_DATA`, `BASE_FACILITY_DATA`, and the solo
oracle tables provide the corresponding player, vehicle, home-base, and
Referee content. `SCENARIO_SITE_DATA` contains site metadata and stable IDs;
locations, NPCs, countdown steps, and events should be child records, which
keeps scenario sites non-linear and preserves player agency.

## Adding a rule

1. Add a stable, domain-prefixed ID (for example, `travel.marching.hard`).
2. Record the printed source page and section.
3. Express inputs as `when` facts and outcomes as atomic effects. Keep dice as
   a `dice` expression and values as typed data, rather than opaque prose.
4. Add resolver tests once the rule has a consuming feature.

The data layer deliberately does not decide how Foundry stores actor data or
how a dialog presents a rule. Adapters translate Foundry documents into facts,
and services interpret the catalog.
