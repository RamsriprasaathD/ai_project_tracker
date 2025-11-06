@echo off
echo ========================================
echo Setting up Neon Database
echo ========================================
echo.

echo Step 1: Checking .env file...
if not exist ".env" (
    echo [ERROR] .env file not found!
    pause
    exit /b 1
)
echo [OK] .env file found
echo.

echo Step 2: Stopping all Node processes...
taskkill /IM node.exe /F 2>nul
if %errorlevel% equ 0 (
    echo [OK] Stopped Node processes
) else (
    echo [INFO] No Node processes running
)
echo.

echo Step 3: Cleaning build cache...
if exist .next rmdir /s /q .next 2>nul
if exist node_modules\.cache rmdir /s /q node_modules\.cache 2>nul
if exist prisma\migrations\.migrate.lock del /f /q prisma\migrations\.migrate.lock 2>nul
echo [OK] Cache cleaned
echo.

echo Step 4: Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] Prisma generation failed
    pause
    exit /b 1
)
echo [OK] Prisma client generated
echo.

echo Step 5: Pushing schema to database...
echo [INFO] This will create all tables in your Neon database
call npx prisma db push
if %errorlevel% neq 0 (
    echo [ERROR] Database push failed!
    echo [HELP] Make sure you updated DATABASE_URL in .env with your Neon connection string
    pause
    exit /b 1
)
echo [OK] Database schema synchronized
echo.

echo Step 6: Testing database connection...
call node test-db.js
if %errorlevel% neq 0 (
    echo [ERROR] Database connection test failed
    pause
    exit /b 1
)
echo.

echo ========================================
echo ✅ SUCCESS! Database setup complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run: npm run dev
echo 2. Go to: http://localhost:3000/register
echo 3. Create your first user account
echo 4. Login and enjoy!
echo.
echo ========================================
pause
