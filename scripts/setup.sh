#!/bin/bash
set -e
# SarthakSetu first-time setup for Linux/macOS.

REQUIRED_ENV="DOMAIN POSTGRES_PASSWORD CLERK_PUBLISHABLE_KEY CLERK_SECRET_KEY VITE_CLERK_PUBLISHABLE_KEY"

command -v docker >/dev/null 2>&1 || {
  echo "❌ Docker is not installed. Please install Docker first: https://docs.docker.com/get-docker/"
  exit 1
}

docker compose version >/dev/null 2>&1 || {
  echo "❌ Docker Compose is not installed. Please install Docker Compose first: https://docs.docker.com/compose/install/"
  exit 1
}

if [ ! -f .env ]; then
  if [ -f .env.production.example ]; then
    echo "📝 Creating .env from .env.production.example..."
    cp .env.production.example .env
  else
    echo "❌ .env.production.example not found. Cannot create .env automatically."
    exit 1
  fi
else
  echo "✅ .env already exists"
fi

echo "📁 Creating required directories..."
mkdir -p backups

echo ""
echo "🚀 Setup complete!"
echo ""
echo "Remaining manual steps:"
for var in ${REQUIRED_ENV}; do
  value=$(grep -E "^${var}=" .env | cut -d= -f2- || true)
  if [ -z "${value}" ] || [ "${value}" = "pk_live_your_key_here" ] || [ "${value}" = "sk_live_your_key_here" ] || [ "${value}" = "pk_test_your_key_here" ] || [ "${value}" = "sk_test_your_key_here" ]; then
    echo "  1. Edit .env and set ${var}"
  fi
done
echo ""
echo "Then run:"
echo "  bash scripts/deploy.sh"
