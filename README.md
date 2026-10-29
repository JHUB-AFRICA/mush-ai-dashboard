# 🍄 Mush-AI Dashboard

Welcome to the Mush-AI project! This repository houses the complete ecosystem connecting your mushroom farm hardware (**PIE**) to a cloud database (**Prisma + PostgreSQL**) and a live web control center (**Express + React**).

---

## 📂 Project Layout

- **`/backend`** — Node.js Express server, Prisma schema, and database models.

- **`/frontend`** — Vite + React dashboard interface for real-time charts.

- **`/pie`** — Python edge node software (USB serial reading from Arduino).

---

## 🌿 Development & Branching Flow

To keep our hardware deployments stable and code clean, we use a friendly two-branch setup:

1. **`dev` (Development):** 

   * This is our active workspace. 
   * Feel free to commit and push all your daily updates, features, and fixes directly to `dev`.
2. **`prod` (Production):** 
   * Reserved for stable, field-tested code. 
   * Changes reach `prod` through pull requests from `dev` that are reviewed and merged by maintainers.

---

## 🚀 Deployment Requisites & Production Architecture

When moving from local development to a live production environment, the ecosystem deploys across three distinct layers:

### 1. Backend Service (`/backend`)
* **Hosting:** Deployed to a cloud platform (e.g., Render, Railway, or Fly.io) pointing to the `/backend` subfolder.
* **Database:** Connected to a managed PostgreSQL instance via Prisma.
* **Environment Variables:** 
  * `DATABASE_URL`: Set to your live cloud PostgreSQL connection string.
  * `PORT`: Automatically handled by your cloud host.

### 2. Frontend Dashboard (`/frontend`)
* **Hosting:** Deployed to a static web host (e.g., Vercel, Netlify, or Cloudflare Pages) pointing to the `/frontend` subfolder. Build command: `npm run build`.
* **Environment Variables:** 
  * `VITE_API_URL`: Must be configured in your static host dashboard to point directly to your live public backend URL (e.g., `https://your-backend.onrender.com`).

### 3. PIE Edge Node (`/pie`)
* **Hardware:** Runs continuously 24/7 on the physical Raspberry Pi at the farm location (managed via `systemd`).
* **Configuration:** Update `pie/config.json` on the Pi so its `backend_url` targets your live cloud backend instead of `http://localhost:5000`.
