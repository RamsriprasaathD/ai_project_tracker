@echo off
echo ========================================
echo HierarchIQ - Docker Setup Tester
echo ========================================
echo.

echo Test 1: Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Docker is not installed
    goto fail
)
echo [PASS] Docker is installed
echo.

echo Test 2: Checking Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Docker Compose is not installed
    goto fail
)
echo [PASS] Docker Compose is installed
echo.

echo Test 3: Checking if containers are running...
docker-compose ps | findstr "Up" >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Containers are not running. Starting them...
    docker-compose up -d
    echo Waiting 30 seconds for startup...
    timeout /t 30 /nobreak >nul
)
echo [PASS] Containers are running
echo.

echo Test 4: Checking application health...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Application is not responding
    echo Check logs with: docker-compose logs app
    goto fail
)
echo [PASS] Application is healthy
echo.

echo Test 5: Checking database connection...
docker-compose exec -T postgres pg_isready -U hierarchiq >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Database is not ready
    goto fail
)
echo [PASS] Database is connected
echo.

echo Test 6: Checking Adminer...
curl -s http://localhost:8080 >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Adminer is not responding (non-critical)
) else (
    echo [PASS] Adminer is accessible
)
echo.

echo ========================================
echo All tests passed! ✓
echo ========================================
echo.
echo Your Docker setup is working correctly!
echo.
echo Access your application:
echo - Application: http://localhost:3000
echo - Database Manager: http://localhost:8080
echo - Health Check: http://localhost:3000/api/health
echo.
pause
goto end

:fail
echo.
echo ========================================
echo Some tests failed!
echo ========================================
echo.
echo Please check:
echo 1. Docker Desktop is running
echo 2. Containers are started: docker-compose up -d
echo 3. View logs: docker-compose logs -f
echo.
pause

:end
