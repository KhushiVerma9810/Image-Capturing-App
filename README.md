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

### 3. "Active Workers" on the dashboard always showed 0

The dashboard counted workers with `{ role: "Worker" }`, but the metric stubbornly read 0 even with active workers in the list. The Role/Permission schemas declare `name` with `lowercase: true`, so roles are stored lowercased (`"worker"`), while my seeds and JWTs use PascalCase (`"Admin"`). The exact-match query never hit. I switched the dashboard counts to case-insensitive matching, which also makes them resilient to however a role's casing ends up stored.

### 4. Authorization: permissions, not role names

I deliberately built authorization around **permissions** rather than hard-coded role checks. Routes gate on `requirePermission("view_images")`, and roles are just bundles of permissions seeded on boot. This made adding custom roles trivial and let the frontend reuse the exact same permission list (returned at login) to gate routes and nav — so the UI never offers something the API would reject.

### 5. Two services, one CORS handshake

Splitting the SPA (static site) and API (web service) onto separate Render URLs meant a deliberate CORS step: the backend's `CLIENT_ORIGIN` has to match the frontend's URL exactly, and the frontend's `VITE_API_URL` has to point at the backend. There's a small chicken-and-egg here (each needs the other's URL), so I deploy the backend first, then the frontend, then set `CLIENT_ORIGIN` and redeploy. The SPA also needed a `/* → /index.html` rewrite so deep links like `/dashboard` don't 404 on refresh.

### 6. Camera capture needs HTTPS

`getUserMedia` only works on secure origins. That's fine on `localhost` during development and on Render (HTTPS by default), but it's the reason the camera won't work over a plain `http://` LAN address — worth knowing if you test from another device.

---

## Assignment Coverage

This section maps the build to the milestones and evaluation criteria from the assignment brief so each scoring item is easy to verify.

### Milestones

**Milestone 1 — Authentication & User Management (30)**
- JWT login with bcrypt password hashing (`server/src/services/auth.service.ts`, `password.service.ts`)
- Default admin seeded on first boot from env vars (`ADMIN_USERNAME` / `ADMIN_PASSWORD`)
- Admin creates accounts, assigns roles (Supervisor / Worker / custom), toggles active status, and removes users (`controllers/user.controller.ts`, `pages/AdminUsersPage.tsx`)
- No public signup — only admins can provision accounts, matching the brief
- **Challenge faced:** keeping the admin seed safe and idempotent across redeploys. Initial seeds re-hashed and overwrote the admin password on every restart, which would have silently rotated credentials. Fixed by checking for an existing admin first and only creating one if none exists.

**Milestone 2 — Role-based Access Control (30)**
- Authorization is **permission-based**, not role-name based — each route gates on `requirePermission(...)` (`middleware/auth.ts`)
- Roles are bundles of permissions, seeded idempotently on boot
- Admin sees everything; Supervisor and Worker get scoped permission sets; custom roles can be created with arbitrary permission combinations (`pages/RolesPage.tsx`)
- Frontend reuses the same permission list (returned at login) to gate routes and nav, so the UI never offers something the API would reject (`auth/AuthContext.tsx`, `components/ProtectedRoute.tsx`)
- **Challenge faced:** the first version hard-coded `if (role === "Admin")` checks across routes, which would have broken the moment a custom role was added. Switched the whole authorization layer to permissions; roles became thin bundles of permissions. This is what made custom roles trivial and let the frontend mirror server gates exactly.
- **Challenge faced:** the dashboard's "Active Workers" count always read 0. The Role/Permission schemas declare `name` with `lowercase: true`, so stored roles were `"worker"` while JWTs used PascalCase `"Worker"` — the exact-match query never hit. Fixed by case-insensitive matching on dashboard counts.

**Milestone 3 — Image Capturing App (30)**
- Post-login redirect to the capture page (`pages/CapturePage.tsx`)
- Live camera preview via `getUserMedia` → capture to `<canvas>` → JPEG upload via multipart/form-data
- Image bytes stored as BSON `Buffer` directly in MongoDB (`models/ImageCapture.ts`), with `select: false` so list queries never pull the bytes
- Authenticated, ownership-scoped download route — non-admins can only fetch their own captures (`controllers/image.controller.ts`)
- **Challenge faced:** the first version wrote uploaded bytes to `server/uploads/` on disk. Worked locally, but every Render redeploy wiped the files because the filesystem there is ephemeral and persistent disks aren't on the free tier. Weighed paid Render Disk vs. S3/Cloudinary vs. storing bytes in MongoDB — chose Mongo with a BSON `Buffer` (not base64, which inflates payloads ~33%) and `select: false` so list queries stay cheap. Bytes are only hydrated on the authenticated download route.
- **Challenge faced:** `getUserMedia` only works on secure origins, so camera capture is fine on `localhost` and on Render (HTTPS by default) but silently fails over a plain `http://` LAN address. Documented this explicitly so anyone testing from another device doesn't get stuck.

**Milestone 4 — Documentation & Deployment (10)**
- This README covers local setup, env variables, deployment topology, and decisions
- Live deployment on Render (link at the top) with MongoDB Atlas
- **Challenge faced:** the Render build failed with dozens of "Could not find a declaration file for module 'express'" errors even though it compiled fine locally. Cause: Render runs builds with `NODE_ENV=production`, so npm skips devDependencies — leaving `@types/*` packages out. Fixed with a repo-level `.npmrc` (`include=dev`) so devDependencies always install during build, and excluded test files from the production `tsc` build so `dist` stays clean.
- **Challenge faced:** splitting the SPA (static site) and API (web service) onto separate Render URLs created a chicken-and-egg CORS handshake — each service needs the other's URL. Solved by deploying the backend first, then the frontend, then setting `CLIENT_ORIGIN` and redeploying. The SPA also needed a `/* → /index.html` rewrite so deep links like `/dashboard` survive a page refresh.

### Evaluation Criteria

**Functionality (30)** — Every brief feature works end-to-end: admin user CRUD, role assignment, RBAC enforcement on both API and UI, camera capture, secure image storage and retrieval. Bonus features: search/filter/pagination on the user list, custom roles, and a dashboard with live metrics.
- **Challenge faced:** keeping list endpoints performant once images were in Mongo. A naïve `find()` on the image collection would pull megabytes of bytes per row. Solved with `select: false` on the `data` field so list queries return only metadata; bytes are only loaded on the authenticated download route.

**Code Quality (30)**
- TypeScript end-to-end (strict mode on both client and server)
- Clear layering on the backend: `routes → controllers → services → models`, with Zod schemas validating every request body / params / query (`server/src/schemas/`)
- Centralized error handling via `AppError` + `asyncHandler` so controllers stay flat (`middleware/error.ts`, `utils/async-handler.ts`)
- Shared types in `client/src/types.ts` mirror server payloads
- npm workspaces monorepo keeps the two apps independent but installable in one shot
- Unit tests for utilities (`npm run test --workspace server`)
- **Challenge faced:** keeping the `dist/` output clean across the test suite and the prod build. Vitest needed test files compiled, but the deploy build shouldn't ship them. Split into a `tsconfig.json` for dev/tests and a `tsconfig.build.json` that excludes `*.test.ts`, so `npm run build` produces only runtime code.

**Security (20)**
- Bcrypt password hashing (never stored in plaintext); password field is `select: false` on the User model
- JWT with 8-hour expiry and a startup check that rejects boots with a weak `JWT_SECRET` (<16 chars)
- Helmet for security headers, CORS pinned to a single configured origin (`CLIENT_ORIGIN`), rate limiting on auth endpoints
- Zod input validation on every mutating route — no raw `req.body` reaches the database
- Image bytes are **never** served as static files — every download passes through JWT auth + an ownership/permission check
- Multer upload limits (`MAX_IMAGE_SIZE_MB`) and MIME-type filtering on uploads
- Environment validation at boot — server refuses to start with missing/invalid critical config
- **Challenge faced:** the initial implementation served images as static files under `/uploads/...` — fast, but anyone with a URL could fetch any image. Replaced with an authenticated streaming route that resolves the image by ID, checks the JWT, and enforces ownership (non-admins can only see their own captures) before sending bytes.

**User Interface (10)**
- React + shadcn/ui + Tailwind v4 — clean, responsive layout that works on phone-width screens
- Live dashboard with metrics and recent activity, sortable/filterable user table, modal dialogs for create/edit, inline form validation, optimistic UI for role/status toggles
- Permission-aware nav: only shows what the current user is allowed to do
- Camera capture UI includes a preview-and-confirm step before upload
- **Challenge faced:** the capture preview rendered zoomed/cropped because the `<video>` element was sized by CSS while the `<canvas>` was sized by intrinsic stream dimensions — capture and preview didn't line up. Fixed by deriving canvas dimensions from `videoWidth` / `videoHeight` and using `object-fit: contain` on the preview so what the user sees is what gets uploaded.

**Documentation (10)**
- Quickstart with prerequisites, env setup, Docker Mongo option, and Atlas option
- Full env-variable reference table
- Step-by-step Render deployment recipe (two services + Atlas)
- Architecture overview, tech-stack table, and a candid "Challenges & Decisions" section explaining the non-obvious calls (image storage strategy, `.npmrc` build fix, permissions-vs-roles, CORS handshake)
- **Challenge faced:** Render's free tier sleeps after ~15 minutes of inactivity, so a first-time visitor hits a 30–60s cold start that looks like a broken app. Called this out explicitly at the top of the README next to the demo link so reviewers know what to expect.
