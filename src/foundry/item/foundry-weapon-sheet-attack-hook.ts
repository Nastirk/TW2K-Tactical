import type { FoundryWeaponAttackAction } from "./foundry-weapon-attack-action";
import type { FoundryWeaponSheetAdapter } from "./foundry-weapon-sheet-adapter";

export interface FoundryItemSheetHookBus {
  on(
    hookName: string,
    callback: (
      application: unknown,
      html: unknown,
    ) => unknown,
  ): unknown;
}

export function registerFoundryWeaponSheetAttackHook(
  hooks: FoundryItemSheetHookBus,
  adapter: FoundryWeaponSheetAdapter,
  action: FoundryWeaponAttackAction,
): void {
  const onRender = (
    application: unknown,
    html: unknown,
  ) => {
    const context = adapter.resolve(
      application,
      html,
    );

    if (!context) {
      return;
    }

    context.addAttackAction(
      async () => {
        await action.launch(
          context.attackerActor,
          context.weapon,
        );
      },
    );
  };

  // Foundry V14 systems may render sheets through legacy Application
  // hooks or ApplicationV2-style hooks. The adapter prevents duplicate
  // buttons when both hooks fire for the same sheet.
  hooks.on("renderItemSheet", onRender);
  hooks.on("renderItemSheetV2", onRender);
}
