export interface CombatActionIdempotency {
  hasApplied(
    messageId: string,
  ): boolean;

  markApplied(
    messageId: string,
  ): void;
}

export class InMemoryCombatActionIdempotency
  implements CombatActionIdempotency
{
  private readonly applied =
    new Set<string>();

  hasApplied(
    messageId: string,
  ): boolean {
    return this.applied.has(
      messageId,
    );
  }

  markApplied(
    messageId: string,
  ): void {
    this.applied.add(
      messageId,
    );
  }
}
