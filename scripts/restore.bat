@echo off
setlocal enabledelayedexpansion
REM Restore SarthakSetu database from a pg_dump custom-format backup file.
if "%~1"=="" (
  echo Usage: %0 ^<backup-file^>
  echo Example: %0 backups\sarthaksetu_backup_20240101_120000.dump
  exit /b 1
)
set BACKUP_FILE=%~1
if not exist %BACKUP_FILE% (
  echo Backup file not found: %BACKUP_FILE%
  exit /b 1
)

echo Restoring from: %BACKUP_FILE%
docker compose exec -T postgres psql -U %POSTGRES_USER:sarthaksetu% -d postgres -c "DROP DATABASE IF EXISTS %POSTGRES_DB:sarthaksetu%;" -c "CREATE DATABASE %POSTGRES_DB:sarthaksetu%;" >nul
docker compose exec -T postgres pg_restore -U %POSTGRES_USER:sarthaksetu% -d %POSTGRES_DB:sarthaksetu% --no-owner --no-privileges < %BACKUP_FILE%
echo Restore complete
