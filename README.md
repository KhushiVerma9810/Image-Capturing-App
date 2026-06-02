# User Management System with Image Capturing App

## Architecture

- `server/`: Node.js + Express + TypeScript API
- `client/`: React + Vite + TypeScript SPA
- `MongoDB`: stores users, roles, and image metadata
- `server/uploads/`: private file storage for captured images

The backend uses JWT authentication, role-based authorization, and protected image download routes. The frontend logs a user in, redirects them to the capture workspace, and lets admins manage users from the same session.

## Assumptions

- Admin credentials are seeded from environment variables on first boot.
- Supervisor and Worker accounts are created by Admins; there is no public self-signup flow.
- Captured images are stored on disk and indexed in MongoDB, then served only through authenticated endpoints.
- The assessment expects a practical production-style implementation, not a full enterprise identity system.

## Run with local MongoDB

The repository is configured to use a local MongoDB instance by default.

1. Copy `.env.example` to `.env` and update values if needed.
2. Start the MongoDB service:

```bash
docker compose up -d mongo
```

3. Install dependencies:

```bash
npm install
```

4. Start the backend:

```bash
npm run dev --workspace server
```

5. Start the frontend in another terminal:

```bash
npm run dev --workspace client
```

6. Open `http://localhost:5173`

```bash
mongodb://127.0.0.1:27017/image_capturing_app
```

## Run with MongoDB Atlas

If you want Atlas instead of local MongoDB, replace `MONGO_URI` in `.env` with your Atlas connection string and allow your current IP address in the Atlas network access settings.

## Default admin

- Username: `admin`
- Password: `Admin@12345`

Change these values in `.env` before running in any non-assessment environment.
