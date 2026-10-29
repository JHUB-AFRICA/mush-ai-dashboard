# 🍄 Mush-AI Frontend Dashboard

A responsive, real-time web dashboard for monitoring smart mushroom cultivation conditions. Built with React and Vite, bundled with a lightweight static server, and deployed as a microservice on Prisma Compute.

---

## 🛠️ Tech Stack & Architecture

- **UI Framework:** [React 18](https://react.dev/)
- **Bundler:** [Vite](https://vitejs.dev/)
- **Production Server:** High-efficiency static file server powered by [Bun](https://bun.sh/) (`server.ts`) with SPA fallback routing
- **Deployment Platform:** [Prisma Compute](https://www.prisma.io/docs/compute) via Prisma Composer (`src/service.ts`)

---

## 📂 Folder Structure

```
frontend/
├── src/
│   ├── App.jsx            # Main dashboard component with sensor metric cards
│   ├── main.jsx           # React DOM entry point
│   └── service.ts         # Prisma Composer service declaration (build adapter)
├── public/                # Static assets (favicons, icons)
├── server.ts              # Native Bun static HTTP file server for production
├── index.html             # Vite HTML root template
├── dist/                  # Built static web bundle and server executable
└── package.json           # Dependencies and build scripts
```

---

## ⚙️ Environment Variables

The dashboard reads the backend API URL dynamically:

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `http://localhost:5000` | Base URL of the backend API service (e.g. `https://api.your-app.prisma.build`) |

Create a `.env` file in `frontend/` for local testing:
```bash
VITE_API_URL=http://localhost:5000
```

---

## 🚀 Development & Build

### Install Dependencies
```bash
cd frontend
npm install
```

### Local Development Server (Vite Hot Reload)
```bash
npm run dev
# Starts local Vite dev server at http://localhost:5173
```

### Production Build
Runs `vite build` followed by bundling `server.ts` into `dist/server.js`:
```bash
npm run build
```

The production output in `dist/` is packaged by the root Prisma Composer module during deployment.
