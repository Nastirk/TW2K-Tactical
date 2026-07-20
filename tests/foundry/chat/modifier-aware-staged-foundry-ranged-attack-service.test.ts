import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  ModifierAwareStagedFoundryRangedAttackService,
} from "../../../src/foundry/chat/modifier-aware-staged-foundry-ranged-attack-service";

describe(
  "ModifierAwareStagedFoundryRangedAttackService",
  () => {
    it(
      "passes the targeted actor UUID into the persisted combat payload",
      async () => {
        const combat = {
          targetActorId:
            "target",
        };

        const workflow = {
          resolve:
            vi.fn()
              .mockResolvedValue({
                combat,
              }),
        };

        const payloadFactory = {
          create:
            vi.fn()
              .mockReturnValue({
                targetActorId:
                  "target",
                targetActorUuid:
                  "Scene.scene-1.Token.token-1.Actor.target",
                finalDamage: 2,
              }),
        };

        const publish =
          vi.fn()
            .mockResolvedValue(
              undefined,
            );

        const service =
          new ModifierAwareStagedFoundryRangedAttackService(
            workflow as never,
            {
              create:
                vi.fn()
                  .mockReturnValue(
                    {},
                  ),
            } as never,
            {
              render:
                vi.fn()
                  .mockReturnValue(
                    "<article></article>",
                  ),
            } as never,
            payloadFactory as never,
            {
              publish,
            } as never,
          );

        const actorUuid =
          "Scene.scene-1.Token.token-1.Actor.target";

        await service.execute({
          attack: {} as never,
          names: {
            attackerName:
              "Attacker",
            targetName:
              "Target",
            weaponName:
              "Weapon",
          },
          targetActorUuid:
            actorUuid,
        });

        expect(
          payloadFactory.create,
        ).toHaveBeenCalledWith(
          combat,
          actorUuid,
        );

        expect(publish)
          .toHaveBeenCalledWith(
            expect.objectContaining({
              metadata:
                expect.objectContaining({
                  targetActorUuid:
                    actorUuid,
                }),
            }),
          );
      },
    );
  },
);
