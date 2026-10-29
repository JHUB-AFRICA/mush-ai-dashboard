import node from "@prisma/composer/node";
import { compute, rawPostgres } from "@prisma/composer-prisma-cloud";

export default compute({
  name: "api",
  deps: { db: rawPostgres() },
  build: node({ module: import.meta.url, entry: "../dist/server.mjs" }),
});
