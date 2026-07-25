#!/bin/bash
set -e
# Update SarthakSetu: backup database, pull latest code, rebuild, and restart.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

BACKUP_FILE=""
if [ -f "${SCRIPT_DIR}/backup.sh" ]; then
  echo "🗄️  Creating pre-update database backup..."
  BACKUP_FILE="$(${SCRIPT_DIR}/backup.sh | tail -1 | sed 's/^Backup complete: //')"
  echo "Pre-update backup: ${BACKUP_FILE}"
fi

echo "📥 Pulling latest code..."
git pull

echo "🐳 Rebuilding and restarting containers..."
docker compose up -d --build

echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo "✅ Update complete. Backup saved at: ${BACKUP_FILE:-none}"
