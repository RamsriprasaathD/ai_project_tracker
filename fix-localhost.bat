@echo off
echo ========================================
echo Fixing Localhost Issues
echo ========================================
echo.

echo Step 1: Stopping all Node processes...
taskkill /IM node.exe /F 2>nul
if %errorlevel% equ 0 (
    echo [OK] Stopped existing Node processes
) else (
    echo [INFO] No Node processes were running
)
echo.

echo Step 2: Cleaning build cache...
if exist .next\dev rmdir /s /q .next\dev
if exist .next\cache rmdir /s /q .next\cache
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo [OK] Cache cleaned
echo.

echo Step 3: Regenerating Prisma Client...
call npx prisma generate
if %errorlevel% equ 0 (
    echo [OK] Prisma client generated
) else (
    echo [ERROR] Prisma generation failed - check DATABASE_URL in .env
    pause
    exit /b 1
)
echo.

echo Step 4: Starting development server...
echo.
echo ========================================
echo Server will start on available port
echo Check terminal output for URL
echo Usually: http://localhost:3001
echo ========================================
echo.
call npm run dev
