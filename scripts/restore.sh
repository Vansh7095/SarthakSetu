#!/bin/bash
set -e
# Restore SarthakSetu database from a backup file.
if [ -z "$1" ]; then
  echo "Usage: $0 <backup-file>"
  echo "Example: $0 backups/sarthaksetu_backup_20240101_120000.sql"
  exit 1
fi

BACKUP_FILE="$1"
if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "Restoring from: ${BACKUP_FILE}"
docker compose exec -T postgres psql \
  -U "${POSTGRES_USER:-sarthaksetu}" \
  -d "${POSTGRES_DB:-sarthaksetu}" \
  < "${BACKUP_FILE}"

echo "Restore complete"
