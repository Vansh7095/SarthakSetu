@echo off
setlocal enabledelayedexpansion
REM Update SarthakSetu: backup database, pull latest code, rebuild, and restart.

if exist scripts\backup.bat (
  echo [INFO] Creating pre-update database backup...
  call scripts\backup.bat
)

echo [INFO] Pulling latest code...
git pull

echo [INFO] Rebuilding and restarting containers...
bash scripts/deploy.sh

echo [INFO] Cleaning up old Docker images...
docker image prune -f

echo [OK] Update complete.
