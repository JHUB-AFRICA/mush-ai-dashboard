# 🍄 Mush-AI Backend

The backend microservice for the Mush-AI smart mushroom cultivation system. It receives sensor telemetry from edge nodes (Raspberry Pi / PIE), persists environmental time-series data to PostgreSQL via Prisma ORM, and serves the latest farm climate readings to the frontend dashboard.

---

## 🛠️ Tech Stack & Architecture

- **Runtime:** [Bun](https://bun.sh/) (high-performance JavaScript & TypeScript runtime)
- **Database & ORM:** [Prisma ORM](https://www.prisma.io/) + PostgreSQL (with connection pooling)
- **Deployment Platform:** [Prisma Compute](https://www.prisma.io/docs/compute) via Prisma Composer
- **Protocol:** HTTP REST with CORS enabled for cross-origin dashboard requests

---

## 📂 Folder Structure

```
backend/
├── prisma/
│   ├── migrations/        # Database schema migrations
│   └── schema.prisma      # SensorLog data model and PostgreSQL datasource
├── src/
│   ├── server.ts          # Bun.serve HTTP server (telemetry ingestion & status polling)
│   └── service.ts         # Prisma Composer service declaration (build adapter & db dependency)
├── dist/                  # Built single-file ESM bundle (dist/server.mjs)
└── package.json           # Dependencies and build scripts
```

---

## 🔌 API Endpoints

### 1. Ingest Telemetry
- **Method:** `POST /api/telemetry`
- **Description:** Called by the Raspberry Pi (`pie/client.py`) every few seconds with smoothed sensor readings.
- **Payload:**
  ```json
  {
    "deviceId": "pie-node-01",
    "co2": 820.5,
    "temperature": 24.2,
    "humidity": 88.0,
    "moisture": 65.4,
    "light": 12.0
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid-...",
      "deviceId": "pie-node-01",
      "co2": 820.5,
      "temperature": 24.2,
      "humidity": 88.0,
      "moisture": 65.4,
      "light": 12.0,
      "timestamp": "2026-10-29T08:00:00.000Z"
    }
  }
  ```

### 2. Fetch Latest Status
- **Method:** `GET /api/status`
- **Description:** Polled periodically by the web dashboard to display real-time conditions.
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "telemetry": {
      "id": "uuid-...",
      "deviceId": "pie-node-01",
      "co2": 820.5,
      "temperature": 24.2,
      "humidity": 88.0,
      "moisture": 65.4,
      "light": 12.0,
      "timestamp": "2026-10-29T08:00:00.000Z"
    }
  }
  ```

---

## 📦 Database Schema (`prisma/schema.prisma`)

```prisma
model SensorLog {
  id          String   @id @default(uuid())
  deviceId    String   @default("pie-node-01")
  co2         Float
  temperature Float
  humidity    Float
  moisture    Float
  light       Float
  timestamp   DateTime @default(now())

  @@index([timestamp])
}
```

---

## 🚀 Development & Build

### Install Dependencies
```bash
cd backend
npm install
```

### Build Bundle
Bun compiles and bundles all dependencies into a single production ESM file:
```bash
npm run build
# Outputs to dist/server.mjs
```

### Run Locally with Bun
```bash
npm run dev:local
```
