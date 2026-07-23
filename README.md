# SarthakSetu (सार्थकसेतु)

A food donation platform connecting surplus food donors (restaurants, hotels, caterers, households) with NGOs and volunteers to reduce food waste in India.

**Built with:** React + Vite · Express 5 · PostgreSQL · Drizzle ORM · Clerk Auth

---

## Table of Contents

- [Requirements](#requirements)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [PostgreSQL Setup](#postgresql-setup)
- [Clerk Setup](#clerk-setup)
- [Development](#development)
- [Production](#production)
- [Docker](#docker)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Requirements

- **Node.js** 20+ (24 recommended)
- **pnpm** 9+ (the only supported package manager)
- **PostgreSQL** 14+ (16 recommended)
- **Clerk account** (free tier works)

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│   PostgreSQL    │
│  @workspace/    │     │  @workspace/    │     │  @workspace/db  │
│    annsetu      │     │   api-server    │     │                 │
│                 │     │                 │     │                 │
│  React 19       │     │  Express 5      │     │  Drizzle ORM    │
│  Vite 7         │     │  pino logging   │     │  6 tables       │
│  Tailwind v4    │     │  Zod validation │     │  4 enums        │
│  Clerk React    │     │  Clerk Express  │     │                 │
│  TanStack Query │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Monorepo Packages

| Package | Path | Type | Purpose |
|---------|------|------|---------|
| `annsetu` | `artifacts/annsetu/` | Frontend | React SPA (pages, components, hooks) |
| `api-server` | `artifacts/api-server/` | Backend | Express REST API |
| `db` | `lib/db/` | Library | Drizzle schema + PostgreSQL connection |
| `api-spec` | `lib/api-spec/` | Library | OpenAPI spec + Orval codegen |
| `api-client-react` | `lib/api-client-react/` | Generated | TanStack Query hooks from OpenAPI |
| `api-zod` | `lib/api-zod/` | Generated | Zod schemas from OpenAPI |

---

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> sarthaksetu
cd sarthaksetu
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your PostgreSQL and Clerk credentials

# 3. Push database schema
pnpm db:push

# 4. Start everything
pnpm dev
```

The backend API runs on **http://localhost:8080** and the frontend on **http://localhost:21683** (or whichever port your `.env` specifies).

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values.

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@localhost:5432/sarthaksetu` |
| `CLERK_PUBLISHABLE_KEY` | Clerk frontend key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk backend key | `sk_test_...` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Same as `CLERK_PUBLISHABLE_KEY` | `pk_test_...` |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Backend API port |
| `FRONTEND_PORT` | `5173` | Frontend Vite dev server port |
| `BASE_PATH` | `/` | Base URL path for the SPA |
| `NODE_ENV` | `development` | `development` or `production` |
| `LOG_LEVEL` | `info` | `trace`, `debug`, `info`, `warn`, `error` |
| `VITE_CLERK_PROXY_URL` | *(empty)* | Clerk proxy URL for custom domains |

---

## PostgreSQL Setup

### Local PostgreSQL

```bash
# macOS (Homebrew)
brew install postgresql
brew services start postgresql
createdb sarthaksetu

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb sarthaksetu

# Then in .env:
DATABASE_URL=postgres://user:password@localhost:5432/sarthaksetu
```

### Docker PostgreSQL

```bash
docker run -d \
  --name sarthaksetu-postgres \
  -e POSTGRES_USER=sarthaksetu \
  -e POSTGRES_PASSWORD=changeme \
  -e POSTGRES_DB=sarthaksetu \
  -p 5432:5432 \
  postgres:16-alpine
```

### Database Commands

```bash
pnpm db:push        # Push schema changes to database
pnpm db:push-force  # Force push (drops and recreates)
pnpm codegen        # Regenerate API clients from OpenAPI spec
```

---

## Clerk Setup

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. In **Developers → API Keys**, copy:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)
4. Add them to your `.env` file

For **local development**, use a **Development** instance.

---

## Development

### Start Both Services

```bash
pnpm dev
```

This uses `concurrently` to run the API and frontend in parallel.

### Start Services Separately

```bash
# Terminal 1 — API (Port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (Port 5173)
pnpm --filter @workspace/annsetu run dev
```

### Useful Commands

```bash
pnpm doctor         # Check environment health
pnpm build          # Full typecheck + build all packages
pnpm start          # Start production API server
pnpm typecheck      # TypeScript check across all packages
pnpm lint           # Check formatting with Prettier
pnpm format         # Auto-format with Prettier
```

### API Codegen

After modifying `lib/api-spec/openapi.yaml`:

```bash
pnpm codegen
```

This regenerates:
- `lib/api-client-react/src/generated/` — React Query hooks
- `lib/api-zod/src/generated/` — Zod validation schemas

---

## Production

### Build

```bash
pnpm build
```

This produces:
- `artifacts/api-server/dist/index.mjs` — bundled backend
- `artifacts/annsetu/dist/public/` — static frontend files

### Start Production Server

```bash
# Set production environment
export NODE_ENV=production
export PORT=8080
export DATABASE_URL=...
export CLERK_PUBLISHABLE_KEY=pk_live_...
export CLERK_SECRET_KEY=sk_live_...
export VITE_CLERK_PUBLISHABLE_KEY=pk_live_...

pnpm start
```

### Serve Frontend Statically

The frontend is a standard Vite SPA. Serve `artifacts/annsetu/dist/public/` with any static file server or reverse proxy:

```bash
# nginx
location / {
    root /var/www/sarthaksetu/artifacts/annsetu/dist/public;
    try_files $uri $uri/ /index.html;
}
```

---

## Docker

### Quick Start with Docker Compose

```bash
# 1. Configure environment
cp .env.production.example .env
# Edit .env with your Clerk live keys

# 2. Build and start
docker compose up -d

# 3. Open http://localhost
```

### Services

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| `postgres` | `postgres:16-alpine` | `5432` | PostgreSQL database |
| `api` | Built from `Dockerfile` | `8080` | Express API server |
| `nginx` | `nginx:alpine` | `80` | Reverse proxy + static frontend |

### Docker Commands

```bash
docker compose up -d          # Start all services
docker compose down           # Stop all services
docker compose logs -f api    # View API logs
docker compose build          # Rebuild after code changes
```

---

## Deployment

### Windows

1. Install [Node.js](https://nodejs.org/) and [PostgreSQL](https://www.postgresql.org/download/windows/)
2. Install pnpm: `npm install -g pnpm`
3. Follow the [Quick Start](#quick-start)
4. Run `pnpm dev`

### Linux / VPS

1. Provision a server (Ubuntu 24.04 LTS recommended)
2. Install Node.js 24, pnpm, PostgreSQL, nginx
3. Clone repository and follow [Quick Start](#quick-start)
4. Build for production: `pnpm build`
5. Serve with PM2 + nginx (see `docs/SYSTEM_MAINTENANCE.md`)

### Home Server

1. Install Node.js and PostgreSQL on your home server
2. Follow the [Quick Start](#quick-start)
3. Use Cloudflare Tunnel or ngrok for external access:
   ```bash
   npx cloudflared tunnel --url http://localhost:8080
   ```

### Cloud VM (AWS, GCP, Azure, DigitalOcean)

1. Create a VM with 2+ CPU cores, 2GB RAM, Ubuntu 24.04
2. Open ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
3. Follow the [Linux / VPS](#linux--vps) instructions
4. Use Let's Encrypt for HTTPS:
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## Troubleshooting

### `PORT environment variable is required`

**Fix:** Set `PORT=8080` in your `.env` file. The default is now `8080`, but old environment files may not have it.

### `DATABASE_URL must be set`

**Fix:** Ensure PostgreSQL is running and `DATABASE_URL` points to it. Check `pnpm doctor` for details.

### `Missing VITE_CLERK_PUBLISHABLE_KEY`

**Fix:** Add your Clerk publishable key to `.env`. Get it from [dashboard.clerk.com](https://dashboard.clerk.com).

### Frontend shows blank page

**Fix:** Check `artifacts/annsetu/dist/public/index.html` exists after build. Ensure `BASE_PATH` matches your URL structure.

### API returns 404 for all routes

**Fix:** Make sure requests go to `/api/*` (e.g., `/api/healthz`). The backend serves API routes under `/api`.

### `pnpm install` fails

**Fix:** You must use pnpm (not npm or yarn). Install it with `npm install -g pnpm`.

### Docker `docker compose up` fails

**Fix:** Ensure Docker Engine and Docker Compose are installed. On some systems, use `docker-compose` (hyphen) instead of `docker compose`.

### Still stuck?

Run the diagnostic tool:
```bash
pnpm doctor
```

---

## Documentation

- [`replit.md`](./replit.md) — Project overview and preferences
- [`docs/TECHNICAL_DOCUMENTATION.md`](./docs/TECHNICAL_DOCUMENTATION.md) — Full technical documentation
- [`docs/SECURITY_AUDIT.md`](./docs/SECURITY_AUDIT.md) — Security analysis and findings
- [`docs/DATABASE_DICTIONARY.md`](./docs/DATABASE_DICTIONARY.md) — Database schema documentation
- [`docs/SYSTEM_MAINTENANCE.md`](./docs/SYSTEM_MAINTENANCE.md) — Operations and deployment guide

---

> **AnnSetu** — *अन्नसेतु* — "Bridge of Food"
