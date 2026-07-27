#!/bin/bash
set -e

# Export the app version from package.json for the health endpoint.
export APP_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "0.0.0")

# Wait for PostgreSQL to be ready before running migrations.
# The pg module is installed in the @workspace/db package, so run the check from there.
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
MAX_RETRIES=30
RETRY_INTERVAL=2
RETRY_COUNT=0

echo "⏳ Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}..."
while true; do
  if (
    cd /app/lib/db && \
    node -e "
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect()
  .then(() => c.query('SELECT 1'))
  .then(() => { c.end(); process.exit(0); })
  .catch((e) => { console.error('PG_CHECK_ERROR:', e.message); c.end(); process.exit(1); });
" 2>&1
  ); then
    break
  fi

  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
    echo "❌ PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT} is not reachable after ${MAX_RETRIES} retries."
    echo "   DATABASE_URL host: ${POSTGRES_HOST}"
    exit 1
  fi

  echo "  PostgreSQL not ready yet (retry ${RETRY_COUNT}/${MAX_RETRIES})..."
  sleep "$RETRY_INTERVAL"
done
echo "✅ PostgreSQL is ready"

# Apply database schema automatically on first startup.
echo "🔄 Running database migrations..."
pnpm --filter @workspace/db run push
echo "✅ Database migrations complete"

# Start the API server.
echo "🚀 Starting API server..."
exec node --enable-source-maps ./api-server/dist/index.mjs
