@echo off
setlocal enabledelayedexpansion
REM Create a PostgreSQL backup in the backups\ directory using pg_dump (custom format).
if not exist backups mkdir backups
for /f "tokens=2-8 delims=/:" %%a in ('%DATE% %TIME%') do (
  set TIMESTAMP=%%c%%a%%b_%%d%%e%%f
)
if "%TIMESTAMP%"=="" set TIMESTAMP=%DATE:/=%_%TIME::=%
set BACKUP_FILE=backups\sarthaksetu_backup_%TIMESTAMP%.dump

echo Creating backup: %BACKUP_FILE%
docker compose exec -T postgres pg_dump -U %POSTGRES_USER:sarthaksetu% -d %POSTGRES_DB:sarthaksetu% -Fc > %BACKUP_FILE%
echo Backup complete: %BACKUP_FILE%
