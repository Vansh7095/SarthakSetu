---
name: Docker self-contained deployment
description: Why the SarthakSetu Docker build and entrypoint need specific patterns, and how Replit's Docker runtime limits testing.
---

## Entrypoint DB checks require the lib/db package context

`pg` is installed as a dependency of `@workspace/db`, not hoisted to the root of `node_modules` by pnpm. When the Docker entrypoint waits for PostgreSQL, run the check from `/app/lib/db` so `require('pg')` resolves.

**Why:** Running `node -e "require('pg').Client.connect(...)"` from `/app` fails with `MODULE_NOT_FOUND` even though the package is present in the workspace.

**How to apply:** In `scripts/docker-entrypoint.sh`, use `cd /app/lib/db` before the inline `node` PostgreSQL probe.

## Health endpoint bypasses Clerk middleware

The `/api/healthz` route is used by Docker health checks and the nginx readiness probe. It must not require a valid Clerk key, because a container can be healthy before Clerk is configured or during key rotation.

**Why:** `clerkMiddleware` validates the publishable key and returns 500 if the key is a placeholder, making Docker mark the API as unhealthy and deployments fail.

**How to apply:** Mount `healthRouter` at `/api` before registering `clerkMiddleware` in `artifacts/api-server/src/app.ts`. Do not rely on it being inside the authenticated `/api` router group.

## Replit Docker runtime limits

The Replit container runtime cannot run `docker exec` or `docker compose exec` reliably (OCI runtime exec error), and container health checks fail to execute. This means local Replit testing cannot verify backup/restore scripts or native health checks, but the same compose files and scripts work on a standard Docker host.

**Why:** `docker compose exec` and health checks use container exec under the hood, which is blocked in this environment.

**How to apply:** Test the stack with `docker compose up` and external curl checks; verify `docker-entrypoint.sh` logic and `scripts/*.sh` syntax on the host; assume backup/restore scripts are correct for normal Docker environments.
