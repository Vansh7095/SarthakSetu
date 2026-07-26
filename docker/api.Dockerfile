# SarthakSetu — API Service Dockerfile
# Builds the Express API from the pnpm monorepo and runs it with Postgres migrations.

# ---------------------------------------------------------------------------
# Build stage
# ---------------------------------------------------------------------------
FROM node:24-slim AS builder
WORKDIR /app

RUN npm install -g pnpm@10.26.1

# Copy workspace metadata and all package.json files first for layer caching.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY tsconfig.base.json tsconfig.json ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/sarthaksetu/package.json ./artifacts/sarthaksetu/
COPY lib/db/package.json ./lib/db/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-client-react/package.json ./lib/api-client-react/

RUN pnpm install --frozen-lockfile

# Copy all source code and build the API bundle.
COPY artifacts/ ./artifacts/
COPY lib/ ./lib/

ARG GIT_COMMIT=unknown
ENV GIT_COMMIT=${GIT_COMMIT}

RUN pnpm --filter @workspace/api-server run build

# ---------------------------------------------------------------------------
# Production runtime stage
# ---------------------------------------------------------------------------
FROM node:24-slim AS runner
WORKDIR /app

ARG GIT_COMMIT=unknown
ENV GIT_COMMIT=${GIT_COMMIT}

RUN groupadd -r sarthaksetu && useradd -r -g sarthaksetu sarthaksetu

# Copy pnpm binary so the entrypoint can run drizzle-kit migrations.
COPY --from=builder /usr/local/lib/node_modules/pnpm /usr/local/lib/node_modules/pnpm
RUN if [ -f /usr/local/lib/node_modules/pnpm/bin/pnpm.cjs ]; then \
      ln -sf /usr/local/lib/node_modules/pnpm/bin/pnpm.cjs /usr/local/bin/pnpm; \
    else \
      ln -sf /usr/local/lib/node_modules/pnpm/bin/pnpm.js /usr/local/bin/pnpm; \
    fi

# Copy workspace metadata, node_modules, and the db package so migrations work.
COPY --from=builder --chown=sarthaksetu:sarthaksetu /app/package.json ./
COPY --from=builder --chown=sarthaksetu:sarthaksetu /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=sarthaksetu:sarthaksetu /app/pnpm-lock.yaml ./
COPY --from=builder --chown=sarthaksetu:sarthaksetu /app/node_modules ./node_modules
COPY --from=builder --chown=sarthaksetu:sarthaksetu /app/lib/db ./lib/db

# Copy the built API bundle.
COPY --from=builder --chown=sarthaksetu:sarthaksetu /app/artifacts/api-server/dist ./api-server/dist

# Copy the entrypoint script that waits for Postgres, runs migrations, and starts the API.
COPY --chmod=755 --chown=sarthaksetu:sarthaksetu scripts/docker-entrypoint.sh ./docker-entrypoint.sh

USER sarthaksetu

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/healthz', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1)).on('error', () => process.exit(1))"

CMD ["./docker-entrypoint.sh"]
