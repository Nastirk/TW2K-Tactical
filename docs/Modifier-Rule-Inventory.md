# Modifier rule inventory

Use this file as the implementation backlog for Twilight: 2000 4E automation.
Each row should represent one independently testable rule or exception.

Do not copy book prose into this file. Record an original short summary and the
licensed book/page/section reference so the rule can be verified later.

## Status meanings

- **Extracted** — copied from the research output; not yet checked.
- **Verified** — page, scope, exceptions, and errata checked against a licensed source.
- **Designed** — facts, automation level, and UI fallback decided.
- **Implemented** — code and tests exist.
- **Validated in Foundry** — tested with a real actor, token, Scene, and chat card.

## Ranged-combat inventory

| ID | Rule family | Short original summary | Source | Facts required | Automation | Current status | Test target |
| --- | --- | --- | --- | --- | --- | --- | --- |
| combat.ranged.range | Range | Apply the appropriate range-band adjustment. | Player's Manual, p. ___ | Weapon ranges, combat distance | Automatic | Implemented; verify | range provider |
| combat.ranged.same-hex | Same hex | Apply the applicable close-range firearm exception. | Player's Manual, p. ___ | Combat distance, target state | Automatic/input | Implemented; verify | same-hex provider |
| combat.ranged.target-prone | Target state | Apply the prone-target adjustment except where an exception applies. | Player's Manual, p. ___ | Target prone, combat distance | Automatic | Implemented; verify | prone provider |
| combat.ranged.target-size | Target state | Apply the adjustment for target size. | Player's Manual, p. ___ | Target size | Automatic/input | Implemented; verify | size provider |
| combat.ranged.elevation | Position | Apply the elevated-position adjustment when the rule applies. | Player's Manual, p. ___ | Token/scene elevation | Inferred/input | Implemented; verify | elevation provider |
| combat.ranged.terrain | Terrain | Apply the target-hex terrain adjustment and exceptions. | Player's Manual, p. ___ | Tagged target Region, distance | Automatic | Implemented; verify | terrain provider |
| combat.ranged.cover | Cover | Apply cover effects and any protected-hit-location armour. | Player's Manual, p. ___ | Cover, direction, location | Input/inferred | Implemented; verify | cover provider/workflow |
| combat.ranged.visibility | Visibility | Apply light, weather, smoke, optical-aid, and LOS rules. | Player's Manual, p. ___ | Scene effects, equipment, LOS | Automatic/input | Implemented; verify | visibility providers |
| combat.ranged.target-movement | Movement | Apply the moving-target adjustment. | Player's Manual, p. ___ | Turn movement history | Tracked/input | Implemented; verify | movement provider |
| combat.ranged.vehicle-fire | Vehicle | Apply the firing-from-moving-vehicle adjustment. | Player's Manual, p. ___ | Vehicle movement state | Tracked/input | Implemented; verify | vehicle provider |
| combat.ranged.aim | Aiming | Resolve quick, fast, and slow aim effects. | Player's Manual, p. ___ | Aim choice, sight, support | Input/automatic | Implemented; verify | resolver/workflow |
| combat.ranged.weapon-support | Weapon handling | Resolve one-handed and machine-gun support restrictions. | Player's Manual, p. ___ | Weapon type, support, mount | Automatic/input | Implemented; verify | resolver/workflow |
| combat.ranged.specialty | Specialty | Apply the relevant combat-specialty adjustment. | Player's Manual, p. ___ | Actor specialty, weapon/action | Automatic | Implemented; verify | specialty provider |
| combat.ranged.called-shot | Called shot | Apply the called-shot adjustment. | Player's Manual, p. ___ | Action choice | Input | Implemented; verify | called-shot provider |
| combat.ranged.helpers | Helpers | Apply valid helper bonuses up to the rule limit. | Player's Manual, p. ___ | Helper participation | Input/tracked | Implemented; verify | helper provider |

## New rows to add after ranged combat

- Melee modifiers and legality rules.
- Suppression, CUF, overwatch, and friendly-fire rules.
- Heavy weapons, explosives, blast, and indirect-fire rules.
- Vehicle combat modifiers.
- Travel, environmental, and campaign rules only when a supported workflow exists.

## Review checklist per row

- [ ] One rule and one outcome only.
- [ ] Book, page, section, and errata status recorded.
- [ ] Trigger conditions and exceptions listed as facts.
- [ ] Automation classified as automatic, inferred, tracked, or input.
- [ ] A safe fallback exists for unknown information.
- [ ] No other provider applies the same adjustment.
- [ ] Unit, interaction, and workflow test planned.
- [ ] Chat-card explanation/localization planned.

