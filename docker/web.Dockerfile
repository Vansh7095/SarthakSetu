# SarthakSetu — Web Frontend Dockerfile
# Builds the Vite React frontend from the pnpm monorepo and serves it with nginx.

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

# Copy all source code and build the static frontend.
COPY artifacts/ ./artifacts/
COPY lib/ ./lib/

ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_CLERK_PROXY_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=${VITE_CLERK_PUBLISHABLE_KEY}
ENV VITE_CLERK_PROXY_URL=${VITE_CLERK_PROXY_URL}

RUN pnpm --filter @workspace/sarthaksetu run build

# ---------------------------------------------------------------------------
# Production runtime stage
# ---------------------------------------------------------------------------
FROM nginx:alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/artifacts/sarthaksetu/dist/public /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/nginx-health || exit 1
