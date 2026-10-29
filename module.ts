// module.ts — Prisma Composer root module (repo root)
import { module } from "@prisma/composer";
import { rawPostgres } from "@prisma/composer-prisma-cloud";
import api from "./backend/src/service.ts";
import web from "./frontend/src/service.ts";

export default module("mushai-dashboard", ({ provision }) => {
  // Provision the shared Postgres database
  const db = provision(rawPostgres({ name: "database" }));

  // API backend — receives telemetry from the Raspberry Pi, serves the frontend
  provision(api, { deps: { db } });

  // Frontend — serves the Vite/React SPA as a static bundle
  provision(web);
});
