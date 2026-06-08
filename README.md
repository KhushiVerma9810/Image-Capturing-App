# User Management System with Image Capturing App

A full-stack app where users log in, capture images from their device camera, and admins manage users, roles, and permissions — all from a single session.

## 🔗 Live Demo

**https://image-capturing-app-1.onrender.com**

Sign in with the seeded admin account to explore everything:

- **Username:** `admin`
- **Password:** `Admin@12345`

> Hosted on Render's free tier, so the backend sleeps after ~15 minutes of inactivity — the **first request after a while can take 30–60 seconds** to wake the server. Subsequent requests are fast.

## Architecture

- `server/` — Node.js + Express + TypeScript REST API
- `client/` — React + Vite + TypeScript SPA (shadcn/ui + Tailwind)
- **MongoDB** (Atlas) — stores users, roles, permissions, image metadata, and the image bytes themselves
- **npm workspaces monorepo** — root `package.json` declares the `server` and `client` workspaces

The backend uses JWT authentication, **permission-based** authorization, and image bytes are served only through authenticated routes — never as static files. The frontend mirrors the server's permissions so the UI shows exactly what the API would allow.

## Tech Stack

| Layer | Choices |
|---|---|
| Frontend | React 18, React Router 6, Vite, TypeScript, shadcn/ui, Tailwind CSS v4 |
| Backend | Express, TypeScript (ESM), Zod validation, JWT, Multer, Helmet, rate limiting |
| Database | MongoDB + Mongoose |
| Auth | JWT (8h expiry), bcrypt password hashing, role → permission mapping |

## Features

- 🔐 JWT login with seeded admin; Admins create Supervisor/Worker (and custom) accounts — no public signup
- 🛂 Permission-based access control (gates both API routes **and** UI), seeded idempotently on boot
- 📸 Camera capture via `getUserMedia` → canvas → JPEG upload
- 🖼️ Authenticated, ownership-scoped image access (non-admins only see their own captures)
- 👤 User management with search, filters, pagination, and role/status controls
- 🧩 Custom roles with configurable permissions
- 📊 Dashboard with live metrics and recent activity

---

## Running Locally

This is an npm **workspaces monorepo** — run `npm install` once at the root and use `--workspace` to target each app.

### Prerequisites

- Node.js 20+ and npm
- Docker (for local MongoDB) **or** a MongoDB Atlas connection string

### 1. Configure environment

Copy the example env file at the repo root and adjust if needed:

```bash
cp .env.example .env
```

`MONGO_URI` and `JWT_SECRET` (≥16 characters) are required — the server validates env at startup and refuses to boot if they're missing or invalid.

### 2. Start MongoDB

**Option A — local via Docker:**

```bash
docker compose up -d mongo      # MongoDB on :27017
```

The default `.env` already points at `mongodb://127.0.0.1:27017/image_capturing_app`.

**Option B — MongoDB Atlas:** replace `MONGO_URI` in `.env` with your Atlas connection string, and add your IP under Atlas → Network Access.

### 3. Install dependencies

```bash
npm install
```

### 4. Run the apps (two terminals)

```bash
npm run dev --workspace server     # API on http://localhost:4000
npm run dev --workspace client     # SPA on http://localhost:5173
```

### 5. Open the app

Visit **http://localhost:5173** and log in with the default admin (`admin` / `Admin@12345`). The admin account is seeded from env vars on first boot.

### Tests

```bash
npm run test --workspace server
```

### Environment variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `MONGO_URI` | ✅ | — | MongoDB connection string |
| `JWT_SECRET` | ✅ | — | ≥16 characters |
| `PORT` | | `4000` | API port |
| `CLIENT_ORIGIN` | | `http://localhost:5173` | CORS allow-list for the SPA |
| `ADMIN_USERNAME` | | `admin` | Seeded admin |
| `ADMIN_PASSWORD` | | `Admin@12345` | Seeded admin (≥8 chars) |
| `MAX_IMAGE_SIZE_MB` | | `8` | Upload size cap |

The client reads `VITE_API_URL` (defaults to `http://localhost:4000`) to find the API.

---

## Deployment (Render)

The app is deployed as **two services** plus a managed database:

1. **MongoDB Atlas** — Render has no managed MongoDB, so the database lives on Atlas (Network Access set to `0.0.0.0/0` because free-tier egress IPs are dynamic).
2. **Backend** — a Render **Web Service**
   - Build: `npm install && npm run build --workspace server`
   - Start: `npm run start --workspace server`
   - Env vars: `MONGO_URI`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `CLIENT_ORIGIN` (= the frontend URL), `NODE_ENV=production`
3. **Frontend** — a Render **Static Site**
   - Build: `npm install && npm run build --workspace client`
   - Publish directory: `client/dist`
   - Env var: `VITE_API_URL` (= the backend URL)
   - Rewrite rule: `/*` → `/index.html` (so client-side routes survive a page refresh)

---

## Challenges & Decisions

A few things didn't work the way I first expected, and here's how I worked through them:

### 1. Images disappeared after every Render deploy

My first version did the obvious thing: write uploaded image bytes to `server/uploads/` on disk and store the path in MongoDB. It worked perfectly locally, but on Render every redeploy/restart wiped the files — the filesystem there is **ephemeral**, and persistent disks aren't available on the free tier. The image *metadata* survived in Mongo, but the actual files were gone, so downloads broke.

I weighed three options: a paid Render Disk, external object storage (S3/Cloudinary), or storing the bytes in MongoDB itself. For an app of this size I chose to **store the image bytes directly in MongoDB**. I considered base64 but went with a binary `Buffer` (BSON Binary) field instead — base64 inflates payloads by ~33%, while a Buffer stores the raw bytes and still fits comfortably under MongoDB's 16 MB document limit (uploads are capped at 8 MB). To keep this efficient I set the field to `select: false` so list queries never drag the bytes along, and the buffer is only loaded on the authenticated download route. This made the app fully stateless and survive redeploys. (Object storage would be the right call at real scale — noted as a future improvement.)

### 2. The Render build failed even though it compiled fine locally

The TypeScript build blew up on Render with dozens of "Could not find a declaration file for module 'express'" errors. The cause: Render runs the build with `NODE_ENV=production`, and npm **skips devDependencies** in that mode — so all the `@types/*` packages and `vitest` weren't installed, and `tsc` had nothing to type-check against.

Rather than move type packages into runtime dependencies (which felt wrong), I added a repo-level `.npmrc` with `include=dev` so the build always installs devDependencies regardless of `NODE_ENV`, and excluded test files from the production `tsc` build so `dist` stays clean. Committed to the repo, this keeps the deploy reproducible without anyone needing to tweak Render's settings.

### 3. Authorization: permissions, not role names

I deliberately built authorization around **permissions** rather than hard-coded role checks. Routes gate on `requirePermission("view_images")`, and roles are just bundles of permissions seeded on boot. This made adding custom roles trivial and let the frontend reuse the exact same permission list (returned at login) to gate routes and nav — so the UI never offers something the API would reject.

### 4. Two services, one CORS handshake

Splitting the SPA (static site) and API (web service) onto separate Render URLs meant a deliberate CORS step: the backend's `CLIENT_ORIGIN` has to match the frontend's URL exactly, and the frontend's `VITE_API_URL` has to point at the backend. There's a small chicken-and-egg here (each needs the other's URL), so I deploy the backend first, then the frontend, then set `CLIENT_ORIGIN` and redeploy. The SPA also needed a `/* → /index.html` rewrite so deep links like `/dashboard` don't 404 on refresh.
