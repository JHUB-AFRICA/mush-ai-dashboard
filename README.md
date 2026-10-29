# 🍄 Mush-AI Farm Ecosystem

An end-to-end intelligent environmental monitoring and control ecosystem for indoor mushroom farming. The platform seamlessly integrates physical farm hardware (Arduino sensors & actuators, Raspberry Pi edge nodes) with a scalable cloud architecture powered by **Prisma Compute**, **Prisma ORM**, **PostgreSQL**, and a real-time **React web dashboard**.

---

## 🏗️ System Architecture

```
                  +--------------------------------------+
                  |         Arduino Controller           |
                  |  (Sensors: CO2, Moisture, Temp, LDR) |
                  |  (Actuators: Relays, LCD, IR remote) |
                  +-------------------+------------------+
                                      | USB Serial (115200 baud)
                                      v
                  +--------------------------------------+
                  |         PIE Edge Node (RPi)          |
                  |     (Moving Average Noise Filter)    |
                  +-------------------+------------------+
                                      | HTTP POST /api/telemetry
                                      v
      +-------------------------------------------------------------+
      |                   Prisma Compute Monorepo                   |
      |                                                             |
      |  +--------------------+             +--------------------+  |
      |  |   Backend (api)    |             |   Frontend (web)   |  |
      |  |  Bun.serve + REST  |             | React + Vite SPA   |  |
      |  +---------+----------+             +---------+----------+  |
      |            |                                  |             |
      |            v                                  v             |
      |  +--------------------+             +--------------------+  |
      |  |     PostgreSQL     |             |  Web Clients (UI)  |  |
      |  |  (Managed via ORM) |             |  Real-time Status  |  |
      |  +--------------------+             +--------------------+  |
      +-------------------------------------------------------------+
```

---

## 📂 Repository Structure

| Folder | Role & Tech Stack | Documentation |
|---|---|---|
| **[`/arduino`](./arduino)** | Embedded C++ firmware on PlatformIO. Reads sensors, triggers relays, communicates over serial. | [Arduino Guide](./arduino/README.md) |
| **[`/pie`](./pie)** | Python edge daemon on Raspberry Pi. Ingests serial data, applies moving-average smoothing, syncs to cloud. | [PIE Edge Guide](./pie/README.md) |
| **[`/backend`](./backend)** | High-throughput Bun HTTP microservice with Prisma ORM and PostgreSQL storage. | [Backend Guide](./backend/README.md) |
| **[`/frontend`](./frontend)** | React 18 + Vite monitoring interface served via Bun static server with SPA routing. | [Frontend Guide](./frontend/README.md) |
| **Root (`/`)** | Prisma Composer orchestrator (`module.ts`, `prisma.config.ts`) and CI/CD pipelines. | See Below |

---

## ☁️ Prisma Compute Cloud Deployment

The repository uses **Prisma Composer** to declare and manage all cloud resources in a single, version-controlled module graph.

### Root Orchestration Files

- **`module.ts`**: Root Composer module that provisions the PostgreSQL database (`rawPostgres()`) and connects both the `api` (backend) and `web` (frontend) services.
- **`prisma.config.ts`**: Prisma 8 configuration specifying target region (`eu-central-1`), node build extensions, and deployment state management.
- **`.github/workflows/prisma-deploy.yml`**: GitHub Actions workflow that automatically builds and deploys branches via `prisma/cloud-deploy-action@v1`.

### Build & Deploy Commands

From the repository root:

```bash
# 1. Build all services (backend bundle + frontend static assets)
npm run build

# 2. Deploy a preview stage (isolated test environment)
npm run deploy:preview

# 3. Deploy production
npm run deploy:prod
```

---

## 🌿 Git & Branching Strategy

- **`dev` (Development):** The active collaboration branch where new features, hardware configurations, and fixes are committed and pushed.
- **`prod` (Production):** The production branch reflecting the live mushroom chamber deployment. Pushes to `prod` trigger automated production deployments via GitHub Actions.

---

## 🚀 Quick Start for Local Development

### 1. Install Dependencies
```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd pie && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && cd ..
```

### 2. Build Services
```bash
npm run build
```

### 3. Run Microservices Locally
- Backend: `cd backend && npm run dev:local`
- Frontend: `cd frontend && npm run dev`
- Edge Node: `cd pie && python client.py`
