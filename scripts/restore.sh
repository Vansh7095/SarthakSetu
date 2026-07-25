#!/bin/bash
set -e
# Restore SarthakSetu database from a pg_dump custom-format backup file.
if [ -z "$1" ]; then
  echo "Usage: $0 <backup-file>"
  echo "Example: $0 backups/sarthaksetu_backup_20240101_120000.dump"
  exit 1
fi

BACKUP_FILE="$1"
if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "Restoring from: ${BACKUP_FILE}"
# Drop and recreate the database for a clean restore.
docker compose exec -T postgres psql \
  -U "${POSTGRES_USER:-sarthaksetu}" \
  -d postgres \
  -c "DROP DATABASE IF EXISTS ${POSTGRES_DB:-sarthaksetu};" \
  -c "CREATE DATABASE ${POSTGRES_DB:-sarthaksetu};" \
  > /dev/null

docker compose exec -T postgres pg_restore \
  -U "${POSTGRES_USER:-sarthaksetu}" \
  -d "${POSTGRES_DB:-sarthaksetu}" \
  --no-owner \
  --no-privileges \
  < "${BACKUP_FILE}"

echo "Restore complete"
