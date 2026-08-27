#!/usr/bin/env bash
set -Eeuo pipefail

# Production deployment helper for Linux hosts, including Fedora/RHEL with
# SELinux enabled. It intentionally keeps the PostgreSQL named volume intact.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

fail() {
  echo "❌ $*" >&2
  exit 1
}

read_env() {
  local key="$1"
  sed -n "s/^${key}=//p" .env | head -n 1
}

require_env() {
  local key="$1"
  local value
  value="$(read_env "$key")"
  [ -n "$value" ] || fail "$key is missing from .env"
  case "$value" in
    *your_key_here*|change_this_to_a_strong_password|replace_with_*|your-new-*|placeholder*)
      fail "$key still contains a placeholder in .env"
      ;;
  esac
}

wait_for_container_health() {
  local container="$1"
  local seconds="${2:-180}"
  local elapsed=0
  local status

  while [ "$elapsed" -lt "$seconds" ]; do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container" 2>/dev/null || true)"
    case "$status" in
      healthy)
        return 0
        ;;
      exited|dead|unhealthy)
        docker compose logs --tail=100 "${container#sarthaksetu-}" >&2 || true
        fail "$container did not become healthy (status: $status)"
        ;;
    esac
    sleep 3
    elapsed=$((elapsed + 3))
  done

  docker compose ps -a >&2 || true
  docker compose logs --tail=100 "${container#sarthaksetu-}" >&2 || true
  fail "$container did not become healthy within ${seconds} seconds"
}

wait_for_container_running() {
  local container="$1"
  local seconds="${2:-60}"
  local elapsed=0
  local status

  while [ "$elapsed" -lt "$seconds" ]; do
    status="$(docker inspect --format '{{.State.Status}}' "$container" 2>/dev/null || true)"
    case "$status" in
      running)
        return 0
        ;;
      exited|dead)
        docker compose logs --tail=100 "${container#sarthaksetu-}" >&2 || true
        fail "$container exited before becoming available"
        ;;
    esac
    sleep 3
    elapsed=$((elapsed + 3))
  done

  docker compose ps -a >&2 || true
  docker compose logs --tail=100 "${container#sarthaksetu-}" >&2 || true
  fail "$container did not start within ${seconds} seconds"
}

command -v docker >/dev/null 2>&1 || fail "Docker is not installed"
docker compose version >/dev/null 2>&1 || fail "Docker Compose is not available"
command -v openssl >/dev/null 2>&1 || fail "openssl is required"
[ -f .env ] || fail ".env is missing. Run: cp .env.production.example .env"

require_env DOMAIN
require_env POSTGRES_PASSWORD
require_env CLERK_PUBLISHABLE_KEY
require_env CLERK_SECRET_KEY
require_env VITE_CLERK_PUBLISHABLE_KEY

DOMAIN="$(read_env DOMAIN)"
PUBLIC_MODE="$(read_env PUBLIC_MODE)"
PUBLIC_MODE="${PUBLIC_MODE:-tunnel}"
POSTGRES_USER="$(read_env POSTGRES_USER)"
POSTGRES_DB="$(read_env POSTGRES_DB)"
POSTGRES_PASSWORD="$(read_env POSTGRES_PASSWORD)"
POSTGRES_USER="${POSTGRES_USER:-sarthaksetu}"
POSTGRES_DB="${POSTGRES_DB:-sarthaksetu}"

case "$DOMAIN" in
  http://*|https://*|*/|*/*)
    fail "DOMAIN must be a hostname only, for example sarthaksetu.app"
    ;;
esac

case "$PUBLIC_MODE" in
  tunnel|direct)
    ;;
  *)
    fail "PUBLIC_MODE must be tunnel or direct"
    ;;
esac

case "$POSTGRES_PASSWORD" in
  *[!A-Za-z0-9._~-]*)
    fail "POSTGRES_PASSWORD may only contain letters, numbers, '.', '_', '~', or '-' because it is used in DATABASE_URL. Generate one with: openssl rand -hex 32"
    ;;
esac

CLERK_PUBLISHABLE_KEY="$(read_env CLERK_PUBLISHABLE_KEY)"
VITE_CLERK_PUBLISHABLE_KEY="$(read_env VITE_CLERK_PUBLISHABLE_KEY)"
[ "$CLERK_PUBLISHABLE_KEY" = "$VITE_CLERK_PUBLISHABLE_KEY" ] ||
  fail "CLERK_PUBLISHABLE_KEY and VITE_CLERK_PUBLISHABLE_KEY must be identical"

VITE_CLERK_PROXY_URL="$(read_env VITE_CLERK_PROXY_URL)"
CORS_ORIGIN="$(read_env CORS_ORIGIN)"
if [ -n "$VITE_CLERK_PROXY_URL" ] && [ "$VITE_CLERK_PROXY_URL" != "https://${DOMAIN}/api/__clerk" ]; then
  fail "VITE_CLERK_PROXY_URL must be https://${DOMAIN}/api/__clerk"
fi
if [ -n "$CORS_ORIGIN" ] && [ "$CORS_ORIGIN" != "https://${DOMAIN}" ]; then
  fail "CORS_ORIGIN must be https://${DOMAIN}"
fi

if [ "$PUBLIC_MODE" = "tunnel" ]; then
  require_env CLOUDFLARE_TUNNEL_TOKEN
fi

[[ "$POSTGRES_USER" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || fail "POSTGRES_USER contains unsupported characters"
[[ "$POSTGRES_DB" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || fail "POSTGRES_DB contains unsupported characters"
[ "${#POSTGRES_PASSWORD}" -ge 20 ] || echo "⚠️  POSTGRES_PASSWORD is shorter than 20 characters; use a longer password for production."

chmod 600 .env
docker compose config -q

echo "▶ Starting PostgreSQL..."
docker compose up -d postgres
for attempt in $(seq 1 40); do
  if docker compose exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    break
  fi
  [ "$attempt" -lt 40 ] || fail "PostgreSQL did not become ready"
  sleep 2
done

# The official PostgreSQL image creates the configured application role on
# first initialization. If an existing volume was initialized with another
# password, repair the role through the container's local socket. This keeps
# the value in .env stable and never deletes the database volume.
echo "▶ Checking the application database password..."
if ! docker compose exec -T postgres \
  env PGPASSWORD="$POSTGRES_PASSWORD" \
  psql -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "SELECT 1" >/dev/null 2>&1; then
  echo "   Existing database password differs; synchronizing the role..."
  if ! docker compose exec -T -u postgres postgres \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
    -v app_password="$POSTGRES_PASSWORD" \
    -c "ALTER ROLE \"$POSTGRES_USER\" WITH PASSWORD :'app_password'" >/dev/null; then
    fail "Could not synchronize the PostgreSQL role password. Database data was not deleted."
  fi
fi

echo "▶ Building and starting the API..."
docker compose up -d --build --force-recreate api
wait_for_container_health sarthaksetu-api

echo "▶ Building and starting the website and public access..."
if [ "$PUBLIC_MODE" = "tunnel" ]; then
  echo "   Cloudflare Tunnel origin: http://web:80"
  docker compose --profile direct stop caddy >/dev/null 2>&1 || true
  docker compose --profile tunnel up -d --build --remove-orphans web cloudflared
else
  docker compose --profile tunnel stop cloudflared >/dev/null 2>&1 || true
  docker compose --profile direct up -d --build --remove-orphans web caddy
fi
wait_for_container_health sarthaksetu-web

if [ "$PUBLIC_MODE" = "tunnel" ]; then
  wait_for_container_running sarthaksetu-cloudflared
else
  wait_for_container_health sarthaksetu-caddy
fi

echo ""
echo "✅ SarthakSetu is running."
echo "   URL:    https://${DOMAIN}"
echo "   Health: https://${DOMAIN}/api/healthz"
echo ""
docker compose ps