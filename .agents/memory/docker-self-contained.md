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

## Copy pnpm from deps stage instead of reinstalling in runner

The runner stage needs `pnpm` only to run `drizzle-kit push` via the entrypoint. Reinstalling it with `npm install -g pnpm` in the runner stage triggers another network round-trip and can fail if the registry is unreachable. Copy the pnpm package from the deps stage and create a symlink.

**Why:** `COPY --from=deps /usr/local/bin/pnpm` copies the content of the symlink, not the symlink itself, so the relative `require('../dist/pnpm.cjs')` inside the wrapper breaks. The package must be copied and `/usr/local/bin/pnpm` must be relinked to the package's real bin file.

**How to apply:** In the Dockerfile runner stage, copy `/usr/local/lib/node_modules/pnpm` from deps and run `ln -sf /usr/local/lib/node_modules/pnpm/bin/pnpm.cjs /usr/local/bin/pnpm`.

## Health endpoint exposes version and git commit

The health endpoint reads `APP_VERSION` from `package.json` (set by the entrypoint) and `GIT_COMMIT` from the build argument. These values are not available at runtime unless explicitly wired through.

**Why:** `process.env.npm_package_version` is only populated when the process is launched by npm, not by `node ...` directly. The git commit is not inside the image because `.git` is excluded by `.dockerignore`.

**How to apply:** Pass `GIT_COMMIT` as a Docker build arg and set it as an `ENV` in the runner stage. In `scripts/docker-entrypoint.sh`, set `export APP_VERSION=$(node -p "require('./package.json').version")`. In `health.ts`, use `process.env.APP_VERSION` and `process.env.GIT_COMMIT`.

## Replit Docker runtime limits

The Replit container runtime cannot run `docker exec` or `docker compose exec` reliably (OCI runtime exec error), and container health checks fail to execute. This means local Replit testing cannot verify backup/restore scripts or native health checks, but the same compose files and scripts work on a standard Docker host.

**Why:** `docker compose exec` and health checks use container exec under the hood, which is blocked in this environment.

**How to apply:** Test the stack with `docker compose up` and external curl checks; verify `docker-entrypoint.sh` logic and `scripts/*.sh` syntax on the host; assume backup/restore scripts are correct for normal Docker environments.

## Fedora production deployment

The production Compose stack must use `:Z` on the bind-mounted Caddyfile (`./docker/Caddyfile:/etc/caddy/Caddyfile:ro,Z`) when deployed on Fedora/RHEL with SELinux enabled. A PostgreSQL named volume initialized with one password ignores later `POSTGRES_PASSWORD` changes; repair the existing application role through the container's local socket rather than deleting the volume.

**Why:** SELinux otherwise blocks Caddy from reading its configuration, and Docker's official PostgreSQL image only applies initialization credentials on a new data directory. Both failures previously appeared as downstream service health/dependency errors.

**How to apply:** Use `scripts/deploy.sh` as the single production entrypoint. It validates domain/Clerk/database settings, preserves the database volume, synchronizes the configured role password, starts services in health-checked order, and builds with the SELinux-safe Caddy mount.
