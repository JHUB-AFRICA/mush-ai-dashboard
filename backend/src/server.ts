/**
 * Mush-AI Backend: native Bun.serve + Bun's built-in Postgres client.
 * The database URL comes from Composer (service.load()), never process.env.
 * The tables are created automatically on first use.
 */
import { SQL } from "bun";
import service from "./service.ts";

const { db } = service.load();
const sql = new SQL({ url: db.url, max: 2, idleTimeout: 10, prepare: false });

let ready: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  ready ??= (async () => {
    // 1. Sensor telemetry stream table
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
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "SensorLog_device_ts_idx" ON "SensorLog" ("deviceId", "timestamp")`);

    // 2. Cultivation Batches table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "Batch" (
        "id"                   TEXT PRIMARY KEY,
        "code"                 TEXT UNIQUE NOT NULL,
        "strain"               TEXT NOT NULL,
        "substrateComposition" TEXT,
        "substrateDryWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 12.0,
        "substrateMoisturePct" DOUBLE PRECISION NOT NULL DEFAULT 62.0,
        "inoculationDate"      TIMESTAMPTZ NOT NULL DEFAULT now(),
        "currentStage"         TEXT NOT NULL DEFAULT 'Pinning',
        "status"               TEXT NOT NULL DEFAULT 'active',
        "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);

    // 3. Harvest Yield Records table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "YieldRecord" (
        "id"            TEXT PRIMARY KEY,
        "batchId"       TEXT NOT NULL,
        "flushNumber"   INT NOT NULL,
        "harvestDate"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "freshWeightKg" DOUBLE PRECISION NOT NULL
      )`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "YieldRecord_batch_idx" ON "YieldRecord" ("batchId")`);
  })().catch((e) => {
    ready = null; // retry on next request
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
      // 1. Telemetry ingestion from Raspberry Pi
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

      // 2. Latest telemetry reading + real hardware heartbeat
      if (req.method === "GET" && url.pathname === "/api/status") {
        await ensureTable();
        const rows = await sql`SELECT * FROM "SensorLog" ORDER BY "timestamp" DESC LIMIT 1`;
        const latest: any = rows[0] ?? null;

        const now = Date.now();
        const ageSeconds = latest ? Math.floor((now - new Date(latest.timestamp).getTime()) / 1000) : null;
        // The edge node pushes every 5s; consider it live if received within 30s
        const isLive = ageSeconds !== null && ageSeconds < 30;

        return reply({
          success: true,
          telemetry: latest,
          health: {
            isLive,
            ageSeconds,
            rpiStatus: isLive ? "connected" : "offline",
            arduinoStatus: isLive ? "streaming" : "offline",
          },
        });
      }

      // 3. Historical telemetry for charts & CSV export
      if (req.method === "GET" && url.pathname === "/api/telemetry/history") {
        await ensureTable();
        const limitParam = parseInt(url.searchParams.get("limit") || "300", 10);
        const limit = Math.min(Math.max(limitParam, 1), 1000);
        const hoursParam = parseFloat(url.searchParams.get("hours") || "24");

        let rows = await sql`
          SELECT * FROM "SensorLog"
          WHERE "timestamp" >= now() - (${hoursParam} || ' hours')::INTERVAL
          ORDER BY "timestamp" ASC
          LIMIT ${limit}
        `;

        if (rows.length === 0) {
          const fallback = await sql`
            SELECT * FROM "SensorLog"
            ORDER BY "timestamp" DESC
            LIMIT ${limit}
          `;
          rows = fallback.reverse();
        }

        return reply({ success: true, history: rows });
      }

      // 4. Batch Management
      if (req.method === "GET" && url.pathname === "/api/batches") {
        await ensureTable();
        const batches = await sql`SELECT * FROM "Batch" ORDER BY "createdAt" DESC`;
        const yields = await sql`SELECT * FROM "YieldRecord" ORDER BY "harvestDate" ASC`;

        const yieldsByBatch = yields.reduce((acc: any, y: any) => {
          (acc[y.batchId] = acc[y.batchId] || []).push(y);
          return acc;
        }, {});

        const result = batches.map((b: any) => ({
          ...b,
          yields: yieldsByBatch[b.id] || [],
        }));

        return reply({ success: true, batches: result });
      }

      if (req.method === "POST" && url.pathname === "/api/batches") {
        await ensureTable();
        const b: any = await req.json();
        const id = crypto.randomUUID();
        const code = b.code || `B${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90) + 10)}`;
        const strain = b.strain || "Oyster PoHu";
        const substrateComposition = b.substrateComposition || "70% wheat straw, 30% sawdust";
        const substrateDryWeightKg = Number(b.substrateDryWeightKg) || 12.0;
        const substrateMoisturePct = Number(b.substrateMoisturePct) || 62.0;
        const currentStage = b.currentStage || "Pinning";

        const rows = await sql`
          INSERT INTO "Batch" ("id", "code", "strain", "substrateComposition", "substrateDryWeightKg", "substrateMoisturePct", "currentStage")
          VALUES (${id}, ${code}, ${strain}, ${substrateComposition}, ${substrateDryWeightKg}, ${substrateMoisturePct}, ${currentStage})
          RETURNING *`;

        return reply({ success: true, batch: rows[0] }, 201);
      }

      // 5. Harvest Yield Logging
      if (req.method === "POST" && url.pathname === "/api/yields") {
        await ensureTable();
        const y: any = await req.json();
        if (!y.batchId || !isNum(Number(y.freshWeightKg))) {
          return reply({ success: false, error: "batchId and freshWeightKg required" }, 400);
        }

        const id = crypto.randomUUID();
        const flushNumber = Number(y.flushNumber) || 1;
        const freshWeightKg = Number(y.freshWeightKg);

        const rows = await sql`
          INSERT INTO "YieldRecord" ("id", "batchId", "flushNumber", "freshWeightKg")
          VALUES (${id}, ${y.batchId}, ${flushNumber}, ${freshWeightKg})
          RETURNING *`;

        return reply({ success: true, yield: rows[0] }, 201);
      }

      return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
    } catch (error) {
      console.error(error);
      return reply({ success: false, error: String(error) }, 500);
    }
  },
});

console.log(`Mush-AI Backend running on port ${service.port()}`);
