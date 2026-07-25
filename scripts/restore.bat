@echo off
REM Restore SarthakSetu database from a backup file.
if "%~1"=="" (
  echo Usage: %~0 ^<backup-file^>
  echo Example: %~0 backups\sarthaksetu_backup_20240101_120000.sql
  exit /b 1
)

set BACKUP_FILE=%~1
if not exist "%BACKUP_FILE%" (
  echo Backup file not found: %BACKUP_FILE%
  exit /b 1
)

echo Restoring from: %BACKUP_FILE%
docker compose exec -T postgres psql -U sarthaksetu -d sarthaksetu < "%BACKUP_FILE%"

echo Restore complete
