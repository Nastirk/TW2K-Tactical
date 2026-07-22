# TW2K Tactical v0.25 — Ammo, RoF & Reloads

v0.25 adds tracked ammunition and reload automation to the existing staged ranged-combat workflow. The target environment remains Foundry VTT V14 with T2K4E 14.0.1.

## Implemented rules

- Ammo dice are capped at `min(RoF, rounds remaining)`.
- An empty tracked weapon cannot attack; one remaining round permits up to one ammo die.
- Slow telescopic aim permits zero ammo dice only.
- Ammo D6s are rolled separately from the base step dice.
- Each ammo-die six can be allocated to damage or reserved for manual additional-hit resolution.
- Zero ammo dice spend one round. With one or more ammo dice, expenditure is the sum of the ammo D6s, capped at the rounds loaded.
- Remaining rounds are persisted to `system.ammo.value` with a stale-state check.
- Reload rolls use AGL + Ranged Combat; Reloader applies +1.
- A successful reload costs a fast action. A failed reload costs a slow action when one remains; otherwise the attempt is forfeited.
- Completed reloads update `system.mag.target`.

Weapons without the recognized T2K4E magazine schema remain on the existing untracked v0.24 attack path.

## Live Foundry smoke test

1. Enable TW2K Tactical in a Foundry V14 world using T2K4E 14.0.1.
2. Open an actor-owned ranged weapon with `system.rof`, `system.mag.target`, `system.mag.max`, and `system.ammo` populated.
3. Confirm both **TW2K Tactical Attack** and **TW2K Tactical Reload** appear on the weapon sheet.
4. Attack with zero ammo dice and verify one round is spent.
5. Attack with the legal maximum ammo dice and verify the D6 results, successes, allocation, expenditure, and remaining rounds in chat and on the ammunition item.
6. Confirm slow telescopic aim rejects any nonzero ammo-dice selection.
7. Confirm a weapon at zero rounds cannot attack and a weapon at one round allows at most one ammo die.
8. Reload with and without the Reloader specialty. Verify fast action on success, slow action on failure, and no magazine change after a failed roll when no slow action remains.
9. Repeat once with a legacy/untracked weapon and confirm its v0.24 attack behavior is unchanged.

## Development verification

```bash
npm ci
npm run verify
```

Push, reliability, jams, suppression, and action-economy ownership remain future milestones.
