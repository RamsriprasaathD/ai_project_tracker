@echo off
echo ========================================
echo HierarchIQ - Docker Quick Start
echo ========================================
echo.

echo Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not running
    echo Please install Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo [OK] Docker is installed
echo.

echo What would you like to do?
echo.
echo 1. Start PRODUCTION environment
echo 2. Start DEVELOPMENT environment (with hot reload)
echo 3. Stop all containers
echo 4. View logs
echo 5. Clean up (remove containers and volumes)
echo 6. Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto production
if "%choice%"=="2" goto development
if "%choice%"=="3" goto stop
if "%choice%"=="4" goto logs
if "%choice%"=="5" goto cleanup
if "%choice%"=="6" goto end

:production
echo.
echo ========================================
echo Starting PRODUCTION environment...
echo ========================================
echo.
echo Building images (first time will take a few minutes)...
docker-compose build
echo.
echo Starting containers...
docker-compose up -d
echo.
echo [OK] Production environment started!
echo.
echo Access your application:
echo - Application: http://localhost:3000
echo - Database Manager: http://localhost:8080
echo - Health Check: http://localhost:3000/api/health
echo.
echo View logs with: docker-compose logs -f
echo.
pause
goto end

:development
echo.
echo ========================================
echo Starting DEVELOPMENT environment...
echo ========================================
echo.
echo This will start with HOT RELOAD enabled
echo Press Ctrl+C to stop
echo.
pause
docker-compose -f docker-compose.dev.yml up
goto end

:stop
echo.
echo ========================================
echo Stopping all containers...
echo ========================================
echo.
docker-compose down
docker-compose -f docker-compose.dev.yml down
echo [OK] All containers stopped
echo.
pause
goto end

:logs
echo.
echo ========================================
echo Viewing container logs...
echo ========================================
echo Press Ctrl+C to stop viewing
echo.
pause
docker-compose logs -f
goto end

:cleanup
echo.
echo ========================================
echo WARNING: This will remove ALL data!
echo ========================================
echo.
echo This will:
echo - Stop all containers
echo - Remove all containers
echo - Remove all volumes (DATABASE WILL BE DELETED!)
echo.
set /p confirm="Are you sure? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo Cleanup cancelled
    pause
    goto end
)
echo.
echo Cleaning up...
docker-compose down -v
docker-compose -f docker-compose.dev.yml down -v
echo.
echo Removing unused Docker images...
docker image prune -f
echo.
echo [OK] Cleanup complete!
echo.
pause
goto end

:end
echo.
echo ========================================
echo Thank you for using HierarchIQ!
echo ========================================
echo.
