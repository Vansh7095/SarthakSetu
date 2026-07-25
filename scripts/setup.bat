@echo off
setlocal enabledelayedexpansion
REM SarthakSetu first-time setup for Windows.

docker --version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker is not installed. Please install Docker first: https://docs.docker.com/get-docker/
  exit /b 1
)

docker compose version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker Compose is not installed. Please install Docker Compose first: https://docs.docker.com/compose/install/
  exit /b 1
)

if not exist .env (
  if exist .env.production.example (
    echo [INFO] Creating .env from .env.production.example...
    copy .env.production.example .env
  ) else (
    echo [ERROR] .env.production.example not found. Cannot create .env automatically.
    exit /b 1
  )
) else (
  echo [OK] .env already exists
)

echo [INFO] Creating required directories...
if not exist backups mkdir backups

echo.
echo [OK] Setup complete!
echo.
echo Remaining manual steps:
echo   1. Edit .env and set CLERK_PUBLISHABLE_KEY
 echo   2. Edit .env and set CLERK_SECRET_KEY
 echo   3. Edit .env and set VITE_CLERK_PUBLISHABLE_KEY
 echo.
echo Then run:
echo   docker compose up -d --build
