# SarthakSetu — Multi-stage Production Dockerfile
# Builds both backend and frontend into a single production image.
# No manual build steps are required outside Docker.

# ---------------------------------------------------------------------------
# Stage 1: Dependencies
# ---------------------------------------------------------------------------
FROM node:24-slim AS deps
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@10.26.1

# Copy workspace definition and lockfile first for layer caching
COPY pnpm-workspace.yaml package.json ./
COPY pnpm-lock.yaml ./

# Copy all package.json files for workspace discovery
COPY artifacts/sarthaksetu/package.json ./artifacts/sarthaksetu/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY lib/db/package.json ./lib/db/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-client-react/package.json ./lib/api-client-react/

# Install dependencies (frozen lockfile for reproducible builds)
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 2: Build
# ---------------------------------------------------------------------------
FROM node:24-slim AS builder
WORKDIR /app

RUN npm install -g pnpm@10.26.1

# Copy installed dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/artifacts ./artifacts
COPY --from=deps /app/lib ./lib
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY tsconfig.base.json tsconfig.json ./

# Copy full source code
COPY artifacts/ ./artifacts/
COPY lib/ ./lib/

# The frontend embeds the Clerk publishable key at build time.
# Pass it as a build arg from docker-compose.yml (never hardcode secrets here).
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=${VITE_CLERK_PUBLISHABLE_KEY}

# Generate API clients from OpenAPI spec
RUN pnpm --filter @workspace/api-spec run codegen

# Build the backend (esbuild bundles to a single file)
RUN pnpm --filter @workspace/api-server run build

# Build the frontend (Vite → static files)
RUN pnpm --filter @workspace/sarthaksetu run build

# ---------------------------------------------------------------------------
# Stage 3: Production Runtime (API + migrations)
# ---------------------------------------------------------------------------
FROM node:24-slim AS runner
WORKDIR /app

# Create non-root user for security
RUN groupadd -r sarthaksetu && useradd -r -g sarthaksetu sarthaksetu

# Install pnpm so the entrypoint can run database migrations
RUN npm install -g pnpm@10.26.1

# Copy backend bundle
COPY --from=builder --chown=sarthaksetu:sarthaksetu /app/artifacts/api-server/dist ./api-server/dist

# Copy workspace metadata, lockfile, and node_modules for pnpm + migrations
COPY --from=builder --chown=sarthaksetu:sarthaksetu /app/package.json ./
COPY --from=builder --chown=sarthaksetu:sarthaksetu /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=sarthaksetu:sarthaksetu /app/pnpm-lock.yaml ./
COPY --from=builder --chown=sarthaksetu:sarthaksetu /app/node_modules ./node_modules

# Copy the db package source so drizzle-kit can push the schema
COPY --from=builder --chown=sarthaksetu:sarthaksetu /app/lib/db ./lib/db

# Copy entrypoint script
COPY --chmod=755 --chown=sarthaksetu:sarthaksetu scripts/docker-entrypoint.sh ./docker-entrypoint.sh

USER sarthaksetu

EXPOSE 8080

# Health check hits the API route and implicitly verifies database connectivity
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/healthz', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1)).on('error', () => process.exit(1))"

CMD ["./docker-entrypoint.sh"]

# ---------------------------------------------------------------------------
# Stage 4: Nginx Frontend
# ---------------------------------------------------------------------------
FROM nginx:alpine AS web
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/artifacts/sarthaksetu/dist/public /usr/share/nginx/html
EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/nginx-health || exit 1
