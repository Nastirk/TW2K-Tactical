import {
  RangedAttackResolver,
} from "./ranged-attack-resolver";
import type {
  AttackContextBuilder,
} from "./attack-context-builder";
import type {
  PostHitResolver,
} from "./post-hit-resolver";
import type {
  CriticalInjuryRollResolver,
} from "./critical-injury-roll-resolver";
import type {
  DeathSaveResolver,
} from "./death-save-resolver";
import {
  StagedEndToEndRangedCombatWorkflow,
  type StagedEndToEndRangedCombatRequest,
  type StagedEndToEndRangedCombatResult,
} from "./staged-end-to-end-ranged-combat-workflow";
import type {
  DiceModifierApplicator,
} from "../dice/modifier-applicator";
import type {
  DiceEngine,
} from "../dice/roller";
import type {
  RangedCombatModifierInput,
  RangedCombatModifierResolution,
} from "../rules/ranged-combat-modifier-types";
import {
  RangedCombatModifierResolver,
} from "../rules/ranged-combat-modifier-resolver";
import {
  StaticModifierProvider,
} from "../rules/providers/static-modifier-provider";

export interface ModifierAwareStagedRangedCombatRequest {
  combat:
    StagedEndToEndRangedCombatRequest;

  modifiers:
    RangedCombatModifierInput;
}

export interface ModifierAwareStagedRangedCombatResult {
  combat:
    StagedEndToEndRangedCombatResult;

  modifierResolution:
    RangedCombatModifierResolution;
}

export class AttackBlockedError
  extends Error
{
  constructor(
    public readonly reason:
      string,
  ) {
    super(reason);
    this.name =
      "AttackBlockedError";
  }
}

export class ModifierAwareStagedRangedCombatWorkflow {
  constructor(
    private readonly contextBuilder:
      AttackContextBuilder,

    /**
     * Existing providers such as range and same-hex firearm modifiers.
     * Kept structurally typed to avoid coupling this orchestration layer
     * to a concrete provider registry implementation.
     */
    private readonly baseProviders:
      readonly unknown[],

    private readonly modifierApplicator:
      DiceModifierApplicator,
    private readonly diceEngine:
      DiceEngine,

    private readonly postHitResolver:
      PostHitResolver,
    private readonly criticalInjuryRollResolver:
      CriticalInjuryRollResolver,
    private readonly deathSaveResolver:
      DeathSaveResolver,

    private readonly rangedCombatModifierResolver:
      RangedCombatModifierResolver,
  ) {}

  async resolve(
    request:
      ModifierAwareStagedRangedCombatRequest,
  ): Promise<
    ModifierAwareStagedRangedCombatResult
  > {
    const modifierResolution =
      this.rangedCombatModifierResolver
        .resolve(
          request.modifiers,
        );

    if (
      !modifierResolution
        .attackAllowed
    ) {
      throw new AttackBlockedError(
        modifierResolution
          .blockedReason ??
          "Attack is not allowed.",
      );
    }

    const staticProvider =
      new StaticModifierProvider(
        modifierResolution.modifiers,
      );

    const rangedAttackResolver =
      new RangedAttackResolver(
        this.contextBuilder,
        [
          ...this.baseProviders,
          staticProvider,
        ] as never,
        this.modifierApplicator,
        this.diceEngine,
      );

    const workflow =
      new StagedEndToEndRangedCombatWorkflow(
        rangedAttackResolver,
        this.postHitResolver,
        this.criticalInjuryRollResolver,
        this.deathSaveResolver,
      );

    const combat =
      await workflow.resolve(
        request.combat,
      );

    return {
      combat,
      modifierResolution,
    };
  }
}
