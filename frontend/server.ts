/**
 * Lightweight static file server for the Vite-built React SPA.
 * Bundled by Bun into dist/server.js alongside the Vite output.
 */
import service from "./src/service.ts";
import { statSync, readFileSync } from "node:fs";
import { join, extname } from "node:path";

const DIST = new URL(".", import.meta.url).pathname;

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

function serveFile(filePath: string): Response {
  const ext = extname(filePath);
  return new Response(readFileSync(filePath), {
    headers: { "Content-Type": MIME[ext] ?? "application/octet-stream" },
  });
}

Bun.serve({
  port: service.port(),
  hostname: "0.0.0.0",
  fetch(req) {
    const url = new URL(req.url);
    let filePath = join(DIST, url.pathname === "/" ? "index.html" : url.pathname);

    try {
      statSync(filePath);
      return serveFile(filePath);
    } catch {
      // SPA fallback — React Router handles unknown paths
      return serveFile(join(DIST, "index.html"));
    }
  },
});

console.log(`Frontend (static) running on port ${service.port()}`);
