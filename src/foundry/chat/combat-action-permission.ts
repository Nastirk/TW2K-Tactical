export interface CombatActionPermission {
  canApplyResult(
    targetActorId: string,
  ): boolean | Promise<boolean>;
}

export class AllowAllCombatActionPermission
  implements CombatActionPermission
{
  canApplyResult(): boolean {
    return true;
  }
}
