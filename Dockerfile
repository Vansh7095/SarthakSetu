# SarthakSetu — Multi-stage Production Dockerfile
# Builds both backend and frontend into a single production image.

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
# onlyBuiltDependencies in pnpm-workspace.yaml handles build script permissions
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

# Set build-time env defaults (will be overridden at runtime)
ENV NODE_ENV=production
ENV PORT=8080
ENV BASE_PATH=/
ENV DATABASE_URL=postgres://placeholder:placeholder@placeholder:5432/placeholder
ENV CLERK_PUBLISHABLE_KEY=placeholder
ENV CLERK_SECRET_KEY=placeholder
ENV VITE_CLERK_PUBLISHABLE_KEY=placeholder

# Generate API clients from OpenAPI spec
RUN pnpm --filter @workspace/api-spec run codegen

# Build the backend (esbuild bundles to a single file)
RUN pnpm --filter @workspace/api-server run build

# Build the frontend (Vite → static files)
RUN pnpm --filter @workspace/sarthaksetu run build

# ---------------------------------------------------------------------------
# Stage 3: Production Runtime
# ---------------------------------------------------------------------------
FROM node:24-slim AS runner
WORKDIR /app

# Create non-root user for security
RUN groupadd -r sarthaksetu && useradd -r -g sarthaksetu sarthaksetu

# Copy backend bundle
COPY --from=builder --chown=sarthaksetu:sarthaksetu /app/artifacts/api-server/dist ./api-server/dist

# Copy frontend static files
COPY --from=builder --chown=sarthaksetu:sarthaksetu /app/artifacts/sarthaksetu/dist/public ./frontend

# Copy only production node_modules for the backend
# (esbuild bundles most deps, but some need runtime like pg)
COPY --from=builder --chown=sarthaksetu:sarthaksetu /app/node_modules ./node_modules
COPY --from=builder --chown=sarthaksetu:sarthaksetu /app/artifacts/api-server/package.json ./api-server/
COPY --from=builder --chown=sarthaksetu:sarthaksetu /app/lib/db/package.json ./lib/db/
COPY --from=builder --chown=sarthaksetu:sarthaksetu /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=sarthaksetu:sarthaksetu /app/package.json ./

USER sarthaksetu

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/healthz', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1)).on('error', () => process.exit(1))"

CMD ["node", "--enable-source-maps", "api-server/dist/index.mjs"]
