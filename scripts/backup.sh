#!/bin/bash
set -e
# Create a PostgreSQL backup in the backups/ directory.
mkdir -p backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backups/sarthaksetu_backup_${TIMESTAMP}.sql"

echo "Creating backup: ${BACKUP_FILE}"
docker compose exec -T postgres pg_dump \
  -U "${POSTGRES_USER:-sarthaksetu}" \
  -d "${POSTGRES_DB:-sarthaksetu}" \
  > "${BACKUP_FILE}"

echo "Backup complete: ${BACKUP_FILE}"
