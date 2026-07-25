@echo off
setlocal enabledelayedexpansion
REM Create a PostgreSQL backup in the backups\ directory.
if not exist backups mkdir backups
for /f "tokens=2-8 delims=/:" %%a in ('echo %date%_%time%') do (
  set "TIMESTAMP=%%a%%b%%c_%%d%%e%%f"
)
set BACKUP_FILE=backups\sarthaksetu_backup_%TIMESTAMP%.sql

echo Creating backup: %BACKUP_FILE%
docker compose exec -T postgres pg_dump -U sarthaksetu -d sarthaksetu > "%BACKUP_FILE%"

echo Backup complete: %BACKUP_FILE%
