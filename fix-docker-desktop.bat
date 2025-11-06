@echo off
echo ========================================
echo Docker Desktop Fix Script
echo ========================================
echo.

echo Step 1: Stopping Docker Desktop...
taskkill /IM "Docker Desktop.exe" /F >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Docker Desktop stopped
) else (
    echo [INFO] Docker Desktop was not running
)
echo.

echo Step 2: Waiting 10 seconds...
timeout /t 10 /nobreak >nul
echo [OK] Wait complete
echo.

echo Step 3: Starting Docker Desktop...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
echo [OK] Docker Desktop starting...
echo.

echo ========================================
echo Please wait 2-3 minutes for Docker Desktop to fully start
echo ========================================
echo.
echo You can check status by:
echo 1. Looking for whale icon in system tray
echo 2. Running: docker --version
echo.
echo Once Docker is running, try:
echo   docker-compose build --no-cache
echo.
pause
