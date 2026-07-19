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
  hooks.on(
    "renderItemSheet",
    (application, html) => {
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
    },
  );
}
