# 🍄 Mush-AI Dashboard

Welcome to the Mush-AI project! This repository houses the complete ecosystem connecting your mushroom farm hardware (**PIE**) to a cloud database (**Prisma + PostgreSQL**) and a live web control center (**Express + React**).

---

## 📂 Project Layout

* **`/backend`** — Node.js Express server, Prisma schema, and database models.
* **`/frontend`** — Vite + React dashboard interface for real-time charts and valve toggles.
* **`/pie`** — Python edge node software (USB serial reading from Arduino, moving average filtering, and Pin 5 actuator control).

---

## 🌿 Development & Branching Flow

To keep our hardware deployments stable and code clean, we use a friendly two-branch setup:

1. **`dev` (Development):** 
   * This is our active workspace. 
   * Feel free to commit and push all your daily updates, features, and fixes directly to `dev`.
2. **`prod` (Production):** 
   * Reserved for stable, field-tested code. 
   * Changes reach `prod` through pull requests from `dev` that are reviewed and merged by maintainers.
