# SarthakSetu (सार्थकसेतु)

A food donation platform connecting surplus food donors (restaurants, hotels, caterers, households) with NGOs and volunteers to reduce food waste in India.

**Built with:** React + Vite · Express 5 · PostgreSQL · Drizzle ORM · Clerk Auth · OpenStreetMap

---

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Folder Structure](#2-folder-structure)
- [3. Requirements](#3-requirements)
- [4. Clone & Install](#4-clone--install)
- [5. Environment Variables](#5-environment-variables)
- [6. Clerk Authentication Setup](#6-clerk-authentication-setup)
- [7. PostgreSQL Setup](#7-postgresql-setup)
- [8. Database Commands](#8-database-commands)
- [9. Development](#9-development)
- [10. Production Build](#10-production-build)
- [11. Docker Deployment](#11-docker-deployment)
- [12. VPS Deployment](#12-vps-deployment)
- [13. Home Server Deployment](#13-home-server-deployment)
- [14. Cloud Deployment](#14-cloud-deployment)
- [15. Reverse Proxy & SSL](#15-reverse-proxy--ssl)
- [16. Updating](#16-updating)
- [17. Troubleshooting](#17-troubleshooting)
- [18. FAQ](#18-faq)
- [19. Additional Documentation](#19-additional-documentation)

---

## 1. Project Overview

### What is SarthakSetu?

SarthakSetu is a full-stack web application that bridges the gap between surplus food and hunger. Donors (restaurants, hotels, caterers, event organizers, households) can list excess food. NGOs and volunteers can browse nearby donations, claim them, and arrange pickup using a 6-digit OTP verification system.

### Key Features

| Feature                | Description                                                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Donor Registration** | Register with name, phone, address, GPS location, and category                                                                |
| **Food Donations**     | List surplus food with type, quantity, prep time, pickup deadline, image, and location                                        |
| **Claim System**       | NGO clicks Claim → 6-digit OTP generated → at pickup, NGO enters OTP → status goes to Completed                               |
| **Interactive Map**    | Color-coded markers (green=household, yellow=restaurant, orange=caterer, red=urgent) showing available donations across India |
| **Dashboards**         | Donors see total plates shared & recent donations; NGOs see claims & plates collected; public platform stats                  |
| **OTP Verification**   | Server-side generated 6-digit code for secure handover at pickup time                                                         |
| **Role-Based Access**  | Donors create donations; NGOs/volunteers browse and claim                                                                     |

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│   PostgreSQL    │
│  React + Vite   │     │  Express 5      │     │  Drizzle ORM    │
│  Tailwind v4    │     │  Zod validation │     │  Connection     │
│  Clerk React    │     │  Pino logging   │     │  Pooling        │
│  TanStack Query │     │  Clerk Express  │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐
│  OpenStreetMap  │  (Free tiles, no API key)
│  react-leaflet  │
└─────────────────┘
```

### Technologies Used

| Layer           | Technology                                  | Version          |
| --------------- | ------------------------------------------- | ---------------- |
| Frontend        | React, Vite, Tailwind CSS v4, Framer Motion | React 19, Vite 7 |
| Backend         | Express 5, Pino logging, esbuild bundling   | Express 5.2      |
| Database        | PostgreSQL, Drizzle ORM, connection pooling | PostgreSQL 16    |
| Auth            | Clerk (Express + React SDKs)                | Clerk v6         |
| Validation      | Zod v4, drizzle-zod                         | zod 3.25         |
| API             | OpenAPI 3.0, Orval codegen                  | Orval 8.9        |
| Maps            | react-leaflet, OpenStreetMap tiles          | leaflet 1.9      |
| Package Manager | pnpm workspaces                             | pnpm 10+         |

### Monorepo Packages

| Package            | Path                    | Type      | Purpose                                                 |
| ------------------ | ----------------------- | --------- | ------------------------------------------------------- |
| `annsetu`          | `artifacts/annsetu/`    | Frontend  | React SPA — pages, components, hooks                    |
| `api-server`       | `artifacts/api-server/` | Backend   | Express REST API — routes, middleware, business logic   |
| `db`               | `lib/db/`               | Library   | Drizzle schema definitions + PostgreSQL connection pool |
| `api-spec`         | `lib/api-spec/`         | Library   | OpenAPI 3.0 spec + Orval codegen configuration          |
| `api-client-react` | `lib/api-client-react/` | Generated | TanStack Query hooks auto-generated from OpenAPI        |
| `api-zod`          | `lib/api-zod/`          | Generated | Zod validation schemas auto-generated from OpenAPI      |
| `scripts`          | `scripts/`              | Utilities | `doctor.ts` environment health check tool               |

---

## 2. Folder Structure

```
sarthaksetu/
├── artifacts/
│   ├── annsetu/              # React frontend application
│   │   ├── src/
│   │   │   ├── pages/        # Route pages (Home, Map, Dashboard, etc.)
│   │   │   ├── components/   # Reusable UI components
│   │   │   ├── lib/          # Hooks, utilities, API client setup
│   │   │   └── main.tsx      # Application entry point
│   │   ├── public/           # Static assets
│   │   ├── vite.config.ts    # Vite configuration (port, base path, plugins)
│   │   └── package.json
│   │
│   ├── api-server/           # Express backend application
│   │   ├── src/
│   │   │   ├── routes/       # API route handlers (donations, claims, users, stats)
│   │   │   ├── middlewares/  # Express middleware (auth, error handling)
│   │   │   ├── lib/          # Logger, seed data, utilities
│   │   │   ├── app.ts        # Express app setup
│   │   │   └── index.ts      # Server entry point (port, cleanup jobs)
│   │   ├── build.mjs         # esbuild production bundler
│   │   └── package.json
│   │
│   └── mockup-sandbox/       # Canvas component preview server (optional)
│
├── lib/
│   ├── db/                   # Database library
│   │   ├── src/schema/       # Drizzle table definitions
│   │   ├── src/index.ts      # Connection pool + schema exports
│   │   └── drizzle.config.ts # Drizzle Kit configuration
│   │
│   ├── api-spec/             # OpenAPI contract
│   │   └── openapi.yaml      # Single source of truth for all API contracts
│   │
│   ├── api-client-react/     # Generated React Query hooks (DO NOT EDIT)
│   │   └── src/generated/
│   │
│   └── api-zod/              # Generated Zod schemas (DO NOT EDIT)
│       └── src/generated/
│
├── scripts/
│   └── src/
│       └── doctor.ts         # Environment diagnostic tool
│
├── docs/                     # Additional documentation
│   ├── DATABASE_DICTIONARY.md   # Full database schema reference
│   ├── SYSTEM_MAINTENANCE.md    # Operations, backups, monitoring
│   └── SECURITY_AUDIT.md        # Security analysis
│
├── Dockerfile                # Multi-stage production Docker build
├── docker-compose.yml        # Full production stack (Postgres + API + nginx)
├── nginx.conf                # Reverse proxy configuration
├── .env.example              # Development environment template
├── .env.production.example   # Production environment template
├── package.json              # Root workspace scripts
├── pnpm-workspace.yaml       # pnpm workspace configuration
├── tsconfig.base.json        # Shared TypeScript settings
└── README.md                 # This file
```

### Important Files for Deployment

| File                    | What It Does                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| `Dockerfile`            | Builds backend + frontend into a single production image (3 stages: deps → builder → runner) |
| `docker-compose.yml`    | Orchestrates PostgreSQL, API, and nginx as a complete production stack                       |
| `nginx.conf`            | Reverse proxy: `/api/*` → backend, `/` → static frontend, SPA fallback, asset caching        |
| `.env.example`          | Template for all required and optional environment variables                                 |
| `scripts/src/doctor.ts` | Diagnostic tool that checks Node, pnpm, PostgreSQL, env vars, dependencies, builds           |

---

## 3. Requirements

### Required Software

| Software   | Minimum Version | Recommended | Check Command    |
| ---------- | --------------- | ----------- | ---------------- |
| Node.js    | 20.x            | 24.x LTS    | `node --version` |
| pnpm       | 9.x             | 10.x        | `pnpm --version` |
| PostgreSQL | 14.x            | 16.x        | `psql --version` |
| Git        | 2.x             | latest      | `git --version`  |

### Optional Software

| Software       | When Needed              | Check Command            |
| -------------- | ------------------------ | ------------------------ |
| Docker         | Docker deployment        | `docker --version`       |
| Docker Compose | Docker deployment        | `docker compose version` |
| nginx          | Production reverse proxy | `nginx -v`               |

### Supported Operating Systems

- **Windows** 10/11 with WSL2 recommended (or native with PostgreSQL installed)
- **Linux** — Ubuntu 22.04/24.04 LTS, Debian 12, Fedora 40+, Arch Linux
- **macOS** 13+ (Ventura/Sonoma/Sequoia) with Homebrew

---

## 4. Clone & Install

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/sarthaksetu.git
cd sarthaksetu
```

### Step 2: Install pnpm (if not already installed)

```bash
# macOS / Linux / WSL
npm install -g pnpm

# Windows (PowerShell as Administrator)
iwr https://get.pnpm.io/install.ps1 -useb | iex

# Verify
pnpm --version
```

> **Note:** This project uses pnpm workspaces. npm and yarn are not supported. The project has a `preinstall` script that blocks installation with npm.

### Step 3: Install Dependencies

```bash
pnpm install
```

This installs all dependencies across the monorepo workspace using the lockfile for reproducible builds.

### Step 4: Verify Your Environment

```bash
pnpm doctor
```

This checks:

- Node.js version (≥20)
- pnpm version (≥9)
- PostgreSQL connectivity
- Required environment variables
- Dependency installation
- Build artifacts

---

## 5. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Then edit `.env` with a text editor.

### Required Variables

| Variable                     | Purpose                                                | Example                                           | Required? |
| ---------------------------- | ------------------------------------------------------ | ------------------------------------------------- | --------- |
| `DATABASE_URL`               | PostgreSQL connection string                           | `postgres://user:pass@localhost:5432/sarthaksetu` | **Yes**   |
| `CLERK_PUBLISHABLE_KEY`      | Clerk frontend key for React SDK                       | `pk_test_ABC123...`                               | **Yes**   |
| `CLERK_SECRET_KEY`           | Clerk backend key for Express SDK                      | `sk_test_XYZ789...`                               | **Yes**   |
| `VITE_CLERK_PUBLISHABLE_KEY` | Same as `CLERK_PUBLISHABLE_KEY`, exposed to Vite build | `pk_test_ABC123...`                               | **Yes**   |

### Optional Variables

| Variable               | Default       | Purpose                            | Production Recommendation                   |
| ---------------------- | ------------- | ---------------------------------- | ------------------------------------------- |
| `PORT`                 | `8080`        | Backend API server port            | Keep at 8080 behind reverse proxy           |
| `FRONTEND_PORT`        | `5173`        | Vite dev server port               | Only used in development                    |
| `BASE_PATH`            | `/`           | Base URL path for the SPA          | Set if deploying to a subdirectory          |
| `NODE_ENV`             | `development` | Runtime environment mode           | Set to `production` for live deploy         |
| `LOG_LEVEL`            | `info`        | Pino log level                     | Use `warn` or `error` in production         |
| `VITE_CLERK_PROXY_URL` | _(empty)_     | Clerk proxy URL for custom domains | Set to `https://yourdomain.com/api/__clerk` |

### Environment Variable Reference

```
# .env — Development Example
NODE_ENV=development
PORT=8080
FRONTEND_PORT=5173
BASE_PATH=/
DATABASE_URL=postgres://sarthaksetu:yourpassword@localhost:5432/sarthaksetu
CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
CLERK_SECRET_KEY=sk_test_your_actual_key_here
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
VITE_CLERK_PROXY_URL=
LOG_LEVEL=info
```

### Docker-Specific

When using Docker Compose, copy `.env.production.example` instead:

```bash
cp .env.production.example .env
```

The Docker Compose file reads from `.env` automatically. In Docker, the database URL uses the internal service name:

```
DATABASE_URL=postgres://sarthaksetu:changeme@postgres:5432/sarthaksetu
```

---

## 6. Clerk Authentication Setup

Clerk handles all user authentication (sign-up, sign-in, password reset, email verification). Follow these steps to set it up.

### Step 1: Create a Clerk Account

1. Go to [https://clerk.com](https://clerk.com)
2. Click **Sign Up** and create an account (free tier is sufficient for development)
3. Verify your email

### Step 2: Create an Application

1. In the Clerk Dashboard, click **Create Application**
2. Name it `SarthakSetu` (or any name you prefer)
3. Choose **Development** instance type (for local development)
4. Select the sign-in methods you want (Email + Password is recommended to start)

### Step 3: Get Your API Keys

1. In the left sidebar, go to **Configure → API Keys**
2. Copy these two values:
   - **Publishable key** — starts with `pk_test_` (development) or `pk_live_` (production)
   - **Secret key** — starts with `sk_test_` (development) or `sk_live_` (production)

### Step 4: Configure Redirect URLs

1. Go to **Configure → URL & redirects**
2. Add these **Redirect URLs**:
   - `http://localhost:5173/` (for local dev frontend)
   - `http://localhost:8080/api/oauth/callback` (for OAuth callbacks)
3. If deploying to production, also add your production domain:
   - `https://yourdomain.com/`
   - `https://yourdomain.com/api/oauth/callback`

### Step 5: Add Keys to `.env`

```bash
# Edit your .env file
CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
CLERK_SECRET_KEY=sk_test_your_actual_key_here
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
```

### Step 6: Development vs Production

|                    | Development                              | Production                              |
| ------------------ | ---------------------------------------- | --------------------------------------- |
| **Instance**       | Create a "Development" instance in Clerk | Create a separate "Production" instance |
| **Key prefix**     | `pk_test_...` / `sk_test_...`            | `pk_live_...` / `sk_live_...`           |
| **Usage limits**   | Strict limits (development only)         | Full production capacity                |
| **Users**          | Test users with `@example.com` domains   | Real user accounts                      |
| **When to switch** | Always start here                        | Switch before public launch             |

> **Important:** Development keys show a Clerk watermark banner and have rate limits. Never use development keys in production.

### Step 7: Verify Clerk is Working

After starting the app (`pnpm dev`), open the frontend and click **Sign Up**. If the Clerk modal appears, authentication is configured correctly.

---

## 7. PostgreSQL Setup

PostgreSQL is the database that stores all users, donations, claims, and verification data. Choose the method that matches your operating system.

### Option A: Docker PostgreSQL (Easiest — Works on All OS)

```bash
# Run PostgreSQL in a Docker container
docker run -d \
  --name sarthaksetu-postgres \
  -e POSTGRES_USER=sarthaksetu \
  -e POSTGRES_PASSWORD=changeme \
  -e POSTGRES_DB=sarthaksetu \
  -p 5432:5432 \
  postgres:16-alpine

# Verify it's running
docker ps

# In your .env:
DATABASE_URL=postgres://sarthaksetu:changeme@localhost:5432/sarthaksetu
```

To stop and remove:

```bash
docker stop sarthaksetu-postgres
docker rm sarthaksetu-postgres
```

### Option B: macOS (Homebrew)

```bash
# Install PostgreSQL
brew install postgresql@16

# Start the service
brew services start postgresql@16

# Create database and user
createdb sarthaksetu

# Verify
psql -d sarthaksetu -c "SELECT version();"

# In your .env:
DATABASE_URL=postgres://$(whoami)@localhost:5432/sarthaksetu
```

> **Note:** Homebrew PostgreSQL uses your macOS username as the default database user with no password required for local connections.

### Option C: Ubuntu / Debian

```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start the service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb sarthaksetu

# Create a dedicated user (recommended)
sudo -u postgres psql -c "CREATE USER sarthaksetu WITH PASSWORD 'changeme';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sarthaksetu TO sarthaksetu;"

# In your .env:
DATABASE_URL=postgres://sarthaksetu:changeme@localhost:5432/sarthaksetu
```

### Option D: Fedora

```bash
# Install PostgreSQL
sudo dnf install postgresql-server postgresql-contrib

# Initialize database
sudo postgresql-setup --initdb

# Start the service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres createdb sarthaksetu
sudo -u postgres psql -c "CREATE USER sarthaksetu WITH PASSWORD 'changeme';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sarthaksetu TO sarthaksetu;"

# In your .env:
DATABASE_URL=postgres://sarthaksetu:changeme@localhost:5432/sarthaksetu
```

### Option E: Arch Linux

```bash
# Install PostgreSQL
sudo pacman -S postgresql

# Initialize database
sudo -iu postgres initdb -D /var/lib/postgres/data

# Start the service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres createdb sarthaksetu
sudo -u postgres psql -c "CREATE USER sarthaksetu WITH PASSWORD 'changeme';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sarthaksetu TO sarthaksetu;"

# In your .env:
DATABASE_URL=postgres://sarthaksetu:changeme@localhost:5432/sarthaksetu
```

### Option F: Windows (WSL2 Recommended)

**Recommended approach:** Use WSL2 with Ubuntu, then follow the Ubuntu instructions above.

**Native Windows alternative:**

1. Download the PostgreSQL installer from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Run the installer (version 16 recommended)
3. During installation, set a password for the `postgres` superuser
4. Keep the default port `5432`
5. After installation, open **pgAdmin** (included in the installer)
6. Create a new database named `sarthaksetu`
7. In your `.env`:
   ```
   DATABASE_URL=postgres://postgres:your_password@localhost:5432/sarthaksetu
   ```

---

## 8. Database Commands

### Push Schema (Development Only)

```bash
# Push Drizzle schema to PostgreSQL (creates tables, indexes, enums)
# This is safe for development but drops and recreates in some cases
pnpm db:push
```

> **Warning:** `db:push` compares your schema to the database and makes changes. In production, use proper migrations instead.

### Force Push (Drops and Recreates)

```bash
# ⚠️ DESTRUCTIVE: Drops all tables and recreates from schema
# Only use this if you want to completely reset your database
pnpm db:push-force
```

### Regenerate API Clients

```bash
# After modifying lib/api-spec/openapi.yaml, regenerate:
# - React Query hooks in lib/api-client-react/src/generated/
# - Zod schemas in lib/api-zod/src/generated/
pnpm codegen
```

### When to Use Each Command

| Command              | When to Use                                               | Safe in Production?                    |
| -------------------- | --------------------------------------------------------- | -------------------------------------- |
| `pnpm db:push`       | First setup, adding new tables/columns during development | No — use migrations instead            |
| `pnpm db:push-force` | Complete database reset (loses all data)                  | **Never**                              |
| `pnpm codegen`       | After modifying `openapi.yaml`                            | Yes (generates code, doesn't touch DB) |

---

## 9. Development

### Start Everything at Once

```bash
pnpm dev
```

This runs both the backend API and frontend dev server in parallel with color-coded output:

- **API** (cyan) — Express server with hot reload
- **FE** (magenta) — Vite dev server with HMR

### What Starts Where

| Service        | URL                                        | What It Is                                    |
| -------------- | ------------------------------------------ | --------------------------------------------- |
| Backend API    | `http://localhost:8080`                    | Express API with auto-rebuild on file changes |
| Frontend       | `http://localhost:5173`                    | Vite dev server with React Fast Refresh       |
| API Health     | `http://localhost:8080/api/healthz`        | Health check endpoint                         |
| Platform Stats | `http://localhost:8080/api/stats/platform` | Public statistics                             |

### Start Services Separately

If you want to run services in separate terminals:

```bash
# Terminal 1 — Backend API (port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (port 5173)
pnpm --filter @workspace/annsetu run dev
```

### Available Root Scripts

```bash
pnpm dev          # Start API + frontend concurrently
pnpm build        # Typecheck + build all packages
pnpm start        # Start production API server (requires build first)
pnpm doctor       # Check environment health
pnpm typecheck    # TypeScript check across all packages
pnpm codegen      # Regenerate API clients from OpenAPI
pnpm db:push      # Push DB schema changes
pnpm db:push-force# Force push (destructive)
pnpm lint         # Check formatting with Prettier
pnpm format       # Auto-format all files with Prettier
pnpm test         # Run tests (placeholder — not yet configured)
```

### API Codegen Workflow

The project uses a contract-first OpenAPI approach:

1. Edit `lib/api-spec/openapi.yaml` to define or modify an API endpoint
2. Run `pnpm codegen` — Orval generates:
   - React Query hooks in `lib/api-client-react/src/generated/`
   - Zod schemas in `lib/api-zod/src/generated/`
3. Implement the route handler in `artifacts/api-server/src/routes/`
4. Use the generated hook in the frontend components

> **Important:** Never manually edit files in `lib/api-client-react/src/generated/` or `lib/api-zod/src/generated/`. They are overwritten by codegen.

---

## 10. Production Build

### Build All Packages

```bash
pnpm build
```

This runs in sequence:

1. TypeScript type check across all packages
2. Build the backend (`artifacts/api-server/dist/index.mjs` — single esbuild bundle)
3. Build the frontend (`artifacts/annsetu/dist/public/` — static HTML/CSS/JS)

### Start Production Server

```bash
# Set production environment
export NODE_ENV=production
export PORT=8080
export DATABASE_URL=postgres://user:pass@localhost:5432/sarthaksetu
export CLERK_PUBLISHABLE_KEY=pk_live_your_key
export CLERK_SECRET_KEY=sk_live_your_key
export VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_key

# Start the production API server
pnpm start
```

The backend serves API routes under `/api/*`. For the frontend, serve the static files from `artifacts/annsetu/dist/public/` using nginx, Apache, or any static file server.

### Production Checklist

Before going live, verify:

- [ ] Using **Production** Clerk keys (`pk_live_` / `sk_live_`)
- [ ] `NODE_ENV=production` is set
- [ ] `DATABASE_URL` points to a production PostgreSQL instance
- [ ] `pnpm build` completed without errors
- [ ] `pnpm start` starts successfully and responds to `/api/healthz`
- [ ] Frontend static files are built in `artifacts/annsetu/dist/public/`
- [ ] Reverse proxy (nginx) is configured to serve frontend + proxy API
- [ ] HTTPS is enabled with a valid SSL certificate
- [ ] Database is backed up

---

## 11. Docker Deployment

Docker is the easiest way to deploy the entire stack on any system.

### Prerequisites

- Docker Engine 24.0+
- Docker Compose 2.20+

### Quick Start

```bash
# 1. Configure environment
cp .env.production.example .env
# Edit .env and add your Clerk live keys

# 2. Build and start all services
docker compose up -d

# 3. Verify everything is running
docker compose ps
docker compose logs -f api

# 4. Open http://localhost in your browser
```

### What Gets Started

| Service    | Container Name         | Port   | Description                     |
| ---------- | ---------------------- | ------ | ------------------------------- |
| PostgreSQL | `sarthaksetu-postgres` | `5432` | Database with persistent volume |
| API Server | `sarthaksetu-api`      | `8080` | Express backend                 |
| nginx      | `sarthaksetu-nginx`    | `80`   | Reverse proxy + static frontend |

### Docker Compose Commands

```bash
# Start all services in background
docker compose up -d

# View logs (all services)
docker compose logs -f

# View logs (specific service)
docker compose logs -f api
docker compose logs -f postgres
docker compose logs -f nginx

# Stop all services (keeps data)
docker compose down

# Stop and remove all data (including database)
docker compose down -v

# Rebuild after code changes
docker compose build --no-cache
docker compose up -d

# Restart a specific service
docker compose restart api

# Execute a command in the API container
docker compose exec api node -e "console.log('works')"
```

### Persistent Data

The `postgres` service uses a Docker volume (`postgres-data`) for persistent storage. Your database survives container restarts and even `docker compose down`. To wipe all data:

```bash
docker compose down -v
```

### Updating Docker Containers

After pulling new code:

```bash
git pull
pnpm install
pnpm build
docker compose build --no-cache
docker compose up -d
```

---

## 12. VPS Deployment

This section covers deploying SarthakSetu on a Virtual Private Server running Ubuntu 24.04 LTS. The same steps apply to Debian, Fedora, and other Linux distributions with minor package manager changes.

### Server Requirements

| Resource | Minimum                | Recommended |
| -------- | ---------------------- | ----------- |
| CPU      | 1 core                 | 2+ cores    |
| RAM      | 1 GB                   | 2 GB        |
| Disk     | 10 GB SSD              | 20 GB SSD   |
| Network  | Open ports 22, 80, 443 | Same        |

### Step-by-Step Ubuntu Deployment

```bash
# ========== 1. UPDATE SYSTEM ==========
sudo apt-get update && sudo apt-get upgrade -y

# ========== 2. INSTALL NODE.JS 24 ==========
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should show v24.x

# ========== 3. INSTALL PNPM ==========
npm install -g pnpm
pnpm --version  # Should show 10.x

# ========== 4. INSTALL POSTGRESQL 16 ==========
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres createdb sarthaksetu
sudo -u postgres psql -c "CREATE USER sarthaksetu WITH PASSWORD 'strong_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sarthaksetu TO sarthaksetu;"

# ========== 5. INSTALL NGINX ==========
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# ========== 6. CLONE PROJECT ==========
cd /var/www
git clone https://github.com/your-org/sarthaksetu.git
cd sarthaksetu

# ========== 7. INSTALL DEPENDENCIES ==========
pnpm install

# ========== 8. CONFIGURE ENVIRONMENT ==========
cp .env.production.example .env
# Edit .env with production Clerk keys and database URL

# ========== 9. PUSH DATABASE SCHEMA ==========
pnpm db:push

# ========== 10. BUILD FOR PRODUCTION ==========
pnpm build

# ========== 11. CONFIGURE NGINX ==========
# Copy the included nginx config
sudo cp nginx.conf /etc/nginx/sites-available/sarthaksetu
sudo ln -sf /etc/nginx/sites-available/sarthaksetu /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# ========== 12. START PRODUCTION SERVER ==========
# Use PM2 or systemd for process management
npm install -g pm2
pm2 start "pnpm start" --name sarthaksetu-api
pm2 save
pm2 startup
```

### VPS Process Management with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start the API server
pm2 start "pnpm start" --name sarthaksetu-api

# View logs
pm2 logs sarthaksetu-api

# Restart
pm2 restart sarthaksetu-api

# Save PM2 config (auto-restart on boot)
pm2 save
pm2 startup
```

---

## 13. Home Server Deployment

### Windows Home Server

1. Install Node.js from [nodejs.org](https://nodejs.org) (LTS version)
2. Install pnpm: `npm install -g pnpm`
3. Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
4. Clone the repository and follow the [Quick Start](#4-clone--install)
5. Use Windows Terminal or PowerShell to run `pnpm dev`

For automatic startup, create a Windows Scheduled Task that runs `pnpm start` on boot.

For external access, use:

- **Cloudflare Tunnel** (free): `npx cloudflared tunnel --url http://localhost:8080`
- **ngrok** (free tier): `npx ngrok http 8080`

### Linux Home Server (Raspberry Pi, NAS, etc.)

Follow the [VPS Deployment](#12-vps-deployment) steps above. For low-power devices like Raspberry Pi:

```bash
# Raspberry Pi OS is Debian-based
sudo apt-get update
sudo apt-get install -y nodejs npm postgresql nginx

# Node.js on Raspberry Pi might be an older version
# Install NodeSource repo for newer versions
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# Continue with clone, install, build, and start steps
```

### Automatic Startup with systemd

Create `/etc/systemd/system/sarthaksetu.service`:

```ini
[Unit]
Description=SarthakSetu API Server
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/sarthaksetu
Environment=NODE_ENV=production
Environment=PORT=8080
EnvironmentFile=/var/www/sarthaksetu/.env
ExecStart=/usr/bin/pnpm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable sarthaksetu
sudo systemctl start sarthaksetu
sudo systemctl status sarthaksetu
```

### Backups

```bash
# Backup database
docker compose exec postgres pg_dump -U sarthaksetu sarthaksetu > backup_$(date +%Y%m%d).sql

# Or with local PostgreSQL
pg_dump -U sarthaksetu sarthaksetu > backup_$(date +%Y%m%d).sql

# Restore database
psql -U sarthaksetu sarthaksetu < backup_20260723.sql
```

### Updates

```bash
cd /var/www/sarthaksetu
git pull
pnpm install
pnpm build

# If using PM2:
pm2 restart sarthaksetu-api

# If using systemd:
sudo systemctl restart sarthaksetu

# If using Docker:
docker compose build --no-cache
docker compose up -d
```

---

## 14. Cloud Deployment

The steps for any cloud provider follow the same pattern as [VPS Deployment](#12-vps-deployment). Here are provider-specific notes.

### DigitalOcean Droplet

1. Create a Droplet with Ubuntu 24.04, 2 vCPU, 2GB RAM
2. Add your SSH key for access
3. SSH in and follow the Ubuntu VPS steps
4. For the database, either:
   - Install PostgreSQL on the Droplet
   - Use DigitalOcean Managed Databases (recommended for production)

### Hetzner Cloud

1. Create a CX21 or CPX21 server with Ubuntu 24.04
2. Add a firewall rule for ports 22, 80, 443
3. SSH in and follow the Ubuntu VPS steps
4. Hetzner's pricing makes this very cost-effective for small deployments

### AWS EC2

1. Launch a t3.small instance with Ubuntu 24.04
2. Configure the security group to allow ports 22, 80, 443
3. Allocate an Elastic IP for a static address
4. SSH in and follow the Ubuntu VPS steps
5. For production database, consider RDS PostgreSQL instead of local PostgreSQL

### Azure Virtual Machine

1. Create a B2s VM with Ubuntu 24.04
2. Configure Network Security Group for ports 22, 80, 443
3. SSH in and follow the Ubuntu VPS steps
4. Consider Azure Database for PostgreSQL for production

### Google Cloud VM

1. Create an e2-medium instance with Ubuntu 24.04
2. Allow HTTP and HTTPS traffic in the firewall rules
3. SSH in and follow the Ubuntu VPS steps
4. Consider Cloud SQL PostgreSQL for production database

### Cloud Database Recommendation

For production, using a managed database is strongly recommended:

| Provider     | Service                       | Why                                   |
| ------------ | ----------------------------- | ------------------------------------- |
| DigitalOcean | Managed PostgreSQL            | Simple, affordable, automated backups |
| AWS          | RDS PostgreSQL                | Enterprise-grade, scalable            |
| Azure        | Azure Database for PostgreSQL | Good integration with Azure services  |
| Google Cloud | Cloud SQL                     | Simple setup, automatic patching      |

---

## 15. Reverse Proxy & SSL

The included `nginx.conf` provides a complete reverse proxy setup.

### Default nginx Configuration

```nginx
server {
    listen 80;
    server_name localhost;

    # API routes → backend
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend static files
    location / {
        root /var/www/sarthaksetu/artifacts/annsetu/dist/public;
        try_files $uri $uri/ /index.html;
    }
}
```

### Using the Included nginx.conf

```bash
# Copy the configuration
sudo cp nginx.conf /etc/nginx/sites-available/sarthaksetu
sudo ln -sf /etc/nginx/sites-available/sarthaksetu /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Update the frontend path in nginx.conf if needed:
# root /var/www/sarthaksetu/artifacts/annsetu/dist/public;

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### SSL with Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot automatically updates nginx.conf with SSL settings
# Test auto-renewal
sudo certbot renew --dry-run
```

After Certbot runs, your nginx configuration will include:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    # ... rest of the config
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Ports Summary

| Port | Protocol | Service                     | Public?          |
| ---- | -------- | --------------------------- | ---------------- |
| 22   | TCP      | SSH                         | Yes (admin only) |
| 80   | HTTP     | nginx (redirects to HTTPS)  | Yes              |
| 443  | HTTPS    | nginx (production traffic)  | Yes              |
| 8080 | HTTP     | Express API (internal only) | No               |
| 5432 | TCP      | PostgreSQL (internal only)  | No               |

> **Security:** Never expose ports 8080 (API) or 5432 (PostgreSQL) directly to the internet. Always use nginx as the reverse proxy.

---

## 16. Updating

### Update the Application

```bash
# Pull latest code
git pull

# Install any new dependencies
pnpm install

# Regenerate API clients if OpenAPI spec changed
pnpm codegen

# Rebuild
pnpm build

# Restart services
# PM2:
pm2 restart sarthaksetu-api

# systemd:
sudo systemctl restart sarthaksetu

# Docker:
docker compose build --no-cache
docker compose up -d
```

### Update Dependencies

```bash
# Check for outdated packages
pnpm outdated

# Update a specific package
pnpm update drizzle-orm

# Update all packages (use with caution)
pnpm update

# After updating, rebuild and test
pnpm build
```

### Database Schema Updates

When the database schema changes:

1. If in development: `pnpm db:push`
2. If in production: create a proper migration or use a migration tool
   - The project currently uses `drizzle-kit push` for development
   - For production, consider setting up `drizzle-kit migrate` with migration files

---

## 17. Troubleshooting

### Environment & Installation

#### `pnpm install` fails with "Use pnpm instead"

**Cause:** The project blocks npm/yarn installation.

**Fix:** Ensure pnpm is installed and you're using it:

```bash
npm install -g pnpm
pnpm install
```

#### `pnpm doctor` shows "node_modules missing"

**Fix:** Run `pnpm install` first.

#### `pnpm doctor` shows dependencies not installed

**Fix:** The check looks in workspace package `node_modules`. Run `pnpm install` to ensure all workspace packages have their dependencies.

### Database

#### `DATABASE_URL must be set`

**Cause:** The `DATABASE_URL` environment variable is not configured.

**Fix:**

```bash
cp .env.example .env
# Edit .env and set DATABASE_URL
```

#### `PostgreSQL not reachable`

**Cause:** PostgreSQL is not running or the connection string is wrong.

**Fix:**

```bash
# Check if PostgreSQL is running
# macOS:
brew services list | grep postgresql

# Linux:
sudo systemctl status postgresql

# Docker:
docker ps | grep postgres

# Test connection
psql "YOUR_DATABASE_URL" -c "SELECT version();"
```

#### `db:push` fails with permission denied

**Cause:** The database user doesn't have permission to create tables.

**Fix:**

```bash
# PostgreSQL
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sarthaksetu TO your_user;"
```

### Application Startup

#### `PORT already in use` or `EADDRINUSE`

**Cause:** Another process is using port 8080 or 5173.

**Fix:**

```bash
# Find what's using the port
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Use a different port
PORT=8081 pnpm dev
FRONTEND_PORT=5174 pnpm dev
```

#### `NODE_ENV=production` but frontend shows dev banner

**Cause:** The frontend was built with development settings.

**Fix:** Rebuild with `NODE_ENV=production`:

```bash
export NODE_ENV=production
pnpm build
```

### Clerk Authentication

#### `Missing VITE_CLERK_PUBLISHABLE_KEY`

**Cause:** The Clerk publishable key is not set in `.env`.

**Fix:**

1. Get your key from [dashboard.clerk.com](https://dashboard.clerk.com)
2. Add to `.env`:
   ```
   CLERK_PUBLISHABLE_KEY=pk_test_your_key
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key
   ```

#### Clerk modal doesn't appear

**Cause:** Redirect URLs may not be configured correctly.

**Fix:** In Clerk Dashboard → Configure → URL & redirects, add:

- `http://localhost:5173/`
- Your production domain if deployed

#### `Clerk has been loaded with development keys`

**This is normal for development.** The warning reminds you to switch to production keys (`pk_live_` / `sk_live_`) before going public.

### Frontend

#### Blank page after opening frontend

**Cause:** The frontend may not be built, or `BASE_PATH` is incorrect.

**Fix:**

```bash
# Check if build output exists
ls artifacts/annsetu/dist/public/index.html

# If missing, build it
pnpm build

# Check BASE_PATH matches your URL
# If serving from a subdirectory, set BASE_PATH=/subdirectory/
```

#### API returns 404 for all routes

**Cause:** Requests may not include the `/api/` prefix.

**Fix:** The backend serves API routes under `/api/*`. Use:

- `http://localhost:8080/api/healthz` ✓
- `http://localhost:8080/healthz` ✗ (wrong)

### Docker

#### `docker compose up` fails

**Cause:** Docker Engine or Docker Compose may not be installed correctly.

**Fix:**

```bash
# Check Docker
docker --version
docker compose version

# On older systems, the command may be:
docker-compose up -d
```

#### Docker container exits immediately

**Cause:** Missing environment variables or database not reachable.

**Fix:**

```bash
# Check logs
docker compose logs api
docker compose logs postgres

# Ensure .env exists and has correct values
# Ensure postgres service is healthy before api starts
```

#### Docker `postgres` port conflict

**Cause:** Port 5432 is already used by a local PostgreSQL instance.

**Fix:** Either stop the local PostgreSQL or change the mapped port in `docker-compose.yml`:

```yaml
ports:
  - "5433:5432" # Map to host port 5433 instead
```

### Build

#### `pnpm build` fails in Docker

**Cause:** The pnpm version in the Docker image may differ from your local version.

**Fix:** The Dockerfile now pins `pnpm@10.26.1`. If you still have issues, ensure `pnpm-lock.yaml` is up to date:

```bash
pnpm install
```

### TypeScript / Type Check

#### `tsc` errors across packages

**Cause:** Stale generated files or lib declarations.

**Fix:**

```bash
# Regenerate API clients
pnpm codegen

# Rebuild lib declarations
pnpm run typecheck:libs

# Full typecheck
pnpm run typecheck
```

---

## 18. FAQ

**Q: Can I run this without Docker?**

A: Yes. Install Node.js, pnpm, and PostgreSQL locally, then follow the [Quick Start](#4-clone--install). Docker is optional but recommended for consistency.

**Q: What if I don't have a Clerk account?**

A: Clerk offers a free tier that is sufficient for development. Sign up at [clerk.com](https://clerk.com). The application will show authentication errors without Clerk keys, but the backend health endpoint and public stats will still work.

**Q: Can I use a different database?**

A: No. The project is built specifically for PostgreSQL using Drizzle ORM's PostgreSQL dialect. MySQL or SQLite would require significant schema changes.

**Q: Do I need a map API key?**

A: No. The project uses OpenStreetMap tiles via Leaflet, which are free and require no API key.

**Q: Can I deploy this on a free tier?**

A: Yes. Options include:

- **Render.com** free tier (web service + PostgreSQL)
- **Railway.app** (generous free tier)
- **Fly.io** (free tier with small VMs)
- **Oracle Cloud** free tier (always-free VMs)

**Q: How do I back up my data?**

A:

```bash
# Database backup
pg_dump -U sarthaksetu sarthaksetu > backup.sql

# For Docker
docker compose exec postgres pg_dump -U sarthaksetu sarthaksetu > backup.sql
```

**Q: Can I run this on Windows without WSL?**

A: Yes, but WSL2 is strongly recommended for a Linux-like development experience. Native Windows requires installing PostgreSQL separately and may have path differences.

**Q: What happens if the API server crashes?**

A: If using PM2 or systemd, the process manager will automatically restart it. The Docker Compose setup also includes `restart: unless-stopped`.

**Q: How do I update the database schema in production?**

A: The project uses `drizzle-kit push` for development. For production, you should set up proper migrations with `drizzle-kit migrate` and migration files. This is a recommended future improvement.

**Q: Is there a mobile app?**

A: Not currently. The frontend is a responsive web application that works on mobile browsers. A dedicated mobile app could be built using the same API.

---

## 19. Additional Documentation

| Document                                                       | What's Inside                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------------------ |
| [`replit.md`](./replit.md)                                     | Original project overview, architecture decisions, stack details   |
| [`docs/DATABASE_DICTIONARY.md`](./docs/DATABASE_DICTIONARY.md) | Complete database schema — tables, columns, enums, relationships   |
| [`docs/SYSTEM_MAINTENANCE.md`](./docs/SYSTEM_MAINTENANCE.md)   | Operations guide — monitoring, backups, logging, scaling, security |
| [`docs/SECURITY_AUDIT.md`](./docs/SECURITY_AUDIT.md)           | Security analysis and findings                                     |

---

> **AnnSetu** — _अन्नसेतु_ — "Bridge of Food"
>
> Built to connect surplus food with those who need it most.
