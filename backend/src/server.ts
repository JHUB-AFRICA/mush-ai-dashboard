/**
 * Mush-AI Backend: native Bun.serve + Bun's built-in Postgres client.
 * The database URL comes from Composer (service.load()), never process.env.
 * The table is created automatically on first use.
 */
import { SQL } from "bun";
import service from "./service.ts";

const { db } = service.load();
const sql = new SQL({ url: db.url, max: 1, idleTimeout: 10, prepare: false });

let ready: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  ready ??= (async () => {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "SensorLog" (
        "id"          TEXT PRIMARY KEY,
        "deviceId"    TEXT NOT NULL DEFAULT 'pie-node-01',
        "co2"         DOUBLE PRECISION NOT NULL,
        "temperature" DOUBLE PRECISION NOT NULL,
        "humidity"    DOUBLE PRECISION NOT NULL,
        "moisture"    DOUBLE PRECISION NOT NULL,
        "light"       DOUBLE PRECISION NOT NULL,
        "timestamp"   TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "SensorLog_timestamp_idx" ON "SensorLog" ("timestamp")`);
  })().catch((e) => {
    ready = null; // try again on the next request
    throw e;
  });
  return ready;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const reply = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: CORS_HEADERS });
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

Bun.serve({
  port: service.port(),
  hostname: "0.0.0.0",

  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
    if (url.pathname === "/health") return reply({ ok: true });

    try {
      // The Pi sends sensor readings here
      if (req.method === "POST" && url.pathname === "/api/telemetry") {
        const b: any = await req.json();
        if (![b.co2, b.temperature, b.humidity, b.moisture, b.light].every(isNum)) {
          return reply({ success: false, error: "co2, temperature, humidity, moisture and light must be numbers" }, 400);
        }
        await ensureTable();
        const rows = await sql`
          INSERT INTO "SensorLog" ("id","deviceId","co2","temperature","humidity","moisture","light")
          VALUES (${crypto.randomUUID()}, ${b.deviceId ?? "pie-node-01"}, ${b.co2}, ${b.temperature}, ${b.humidity}, ${b.moisture}, ${b.light})
          RETURNING *`;
        return reply({ success: true, data: rows[0] }, 201);
      }

      // The website reads the latest reading from here
      if (req.method === "GET" && url.pathname === "/api/status") {
        await ensureTable();
        const rows = await sql`SELECT * FROM "SensorLog" ORDER BY "timestamp" DESC LIMIT 1`;
        return reply({ success: true, telemetry: rows[0] ?? null });
      }

      return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
    } catch (error) {
      console.error(error);
      return reply({ success: false, error: String(error) }, 500);
    }
  },
});

console.log(`Mush-AI Backend running on port ${service.port()}`);
