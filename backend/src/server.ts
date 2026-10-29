/**
 * Mush-AI Backend — Express replaced with native Bun.serve.
 * DATABASE_URL is injected at runtime by Prisma Compute via service.load().
 */
import service from "./service.ts";
import { PrismaClient } from "@prisma/client";

// Read the Postgres URL from the Compute runtime (never from process.env directly)
const { db } = service.load();
const prisma = new PrismaClient({ datasources: { db: { url: db.url } } });

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

Bun.serve({
  port: service.port(),
  hostname: "0.0.0.0",

  async fetch(req) {
    const url = new URL(req.url);

    // Preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // POST /api/telemetry  — Raspberry Pi sends readings here
    if (req.method === "POST" && url.pathname === "/api/telemetry") {
      try {
        const body = (await req.json()) as {
          deviceId?: string;
          co2: number;
          temperature: number;
          humidity: number;
          moisture: number;
          light: number;
        };

        const newLog = await prisma.sensorLog.create({
          data: {
            deviceId: body.deviceId ?? "pie-node-01",
            co2: body.co2,
            temperature: body.temperature,
            humidity: body.humidity,
            moisture: body.moisture,
            light: body.light,
          },
        });

        return Response.json(
          { success: true, data: newLog },
          { status: 201, headers: CORS_HEADERS }
        );
      } catch (error) {
        console.error("Error saving telemetry:", error);
        return Response.json(
          { success: false, error: String(error) },
          { status: 500, headers: CORS_HEADERS }
        );
      }
    }

    // GET /api/status  — Frontend polls for the latest reading
    if (req.method === "GET" && url.pathname === "/api/status") {
      try {
        const telemetry = await prisma.sensorLog.findFirst({
          orderBy: { timestamp: "desc" },
        });
        return Response.json(
          { success: true, telemetry },
          { headers: CORS_HEADERS }
        );
      } catch (error) {
        return Response.json(
          { success: false, error: String(error) },
          { status: 500, headers: CORS_HEADERS }
        );
      }
    }

    return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
  },
});

console.log(`Mush-AI Backend running on port ${service.port()}`);
