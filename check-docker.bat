@echo off
echo ========================================
echo Docker Desktop Status Checker
echo ========================================
echo.

echo Checking if Docker Desktop is running...
echo.

docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Docker Desktop is NOT running!
    echo.
    echo Please follow these steps:
    echo 1. Press Windows Key
    echo 2. Search for "Docker Desktop"
    echo 3. Click to open it
    echo 4. Wait for whale icon in system tray
    echo 5. Wait until it says "Docker Desktop is running"
    echo 6. Then run this script again
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is installed: 
docker --version
echo.

docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Docker daemon is NOT running!
    echo.
    echo Docker is installed but not running.
    echo.
    echo Please:
    echo 1. Open Docker Desktop application
    echo 2. Wait for it to start (1-2 minutes)
    echo 3. Look for whale icon in system tray
    echo 4. Then run this script again
    echo.
    pause
    exit /b 1
)

echo [OK] Docker daemon is running
echo.

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Docker Compose is not available
    pause
    exit /b 1
)

echo [OK] Docker Compose is available:
docker-compose --version
echo.

echo ========================================
echo SUCCESS! Docker is ready to use!
echo ========================================
echo.
echo You can now run:
echo   docker-compose up -d
echo.
echo Or use the interactive script:
echo   docker-start.bat
echo.
pause
