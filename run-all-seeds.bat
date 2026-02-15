@echo off
echo ========================================
echo Running All Seed Scripts
echo ========================================
echo.

echo [1/3] Seeding Theme Layouts...
call npm run seed:themes
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Theme seeding failed!
    pause
    exit /b 1
)
echo.

echo [2/3] Seeding Section Layouts...
call npm run seed:section-layouts
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Section Layout seeding failed!
    pause
    exit /b 1
)
echo.

echo [3/3] Verifying Seed Data...
call node scripts/verify-seed-data.js
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Verification failed!
    pause
    exit /b 1
)
echo.

echo ========================================
echo All Seeds Completed Successfully!
echo ========================================
pause
