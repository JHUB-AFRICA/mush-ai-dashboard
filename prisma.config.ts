import { defineConfig as composer } from "@prisma/composer/config";
import { nodeBuild } from "@prisma/composer/node/control";
import { prismaCloud, prismaState } from "@prisma/composer-prisma-cloud/control";
import { definePrismaConfig } from "prisma/config";

export default definePrismaConfig({
  composer: composer({
    extensions: [
      // eu-central-1 is the closest region; cannot be changed after first deploy
      prismaCloud({ region: "eu-central-1" }),
      nodeBuild(),
    ],
    state: prismaState(),
  }),
});
