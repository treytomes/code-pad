@echo off
REM Build only the NSIS installer from existing unpacked app
REM Run this if you already have win-unpacked/ from a previous build

echo ========================================
echo CodePad - Rebuild Installer Only
echo ========================================
echo.

echo This will create the NSIS installer from the existing win-unpacked directory.
echo.

REM Check if win-unpacked exists
if not exist "release\win-unpacked" (
    echo ERROR: release\win-unpacked directory not found
    echo Please run the full build first:
    echo   npm run build:prod
    echo.
    pause
    exit /b 1
)

echo Found win-unpacked directory.
echo.

REM Temporarily disable antivirus real-time scanning if possible
echo NOTE: If this fails, try:
echo   1. Temporarily disable Windows Defender real-time protection
echo   2. Add exclusion for: %CD%\release
echo   3. Run as Administrator
echo.

echo Building NSIS installer...
echo.

REM Use electron-builder with --dir flag to skip packing, then build installer
call npx electron-builder --win --x64 --prepackaged release\win-unpacked
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Installer build failed
    echo.
    echo Common causes:
    echo   - Antivirus locking files (add exclusion for release folder)
    echo   - Insufficient permissions (try Run as Administrator)
    echo   - win-unpacked directory incomplete
    echo.
    pause
    exit /b 1
)

echo.
echo Checking for installer...
if exist "release\CodePad-Setup-*.exe" (
    echo.
    echo SUCCESS! Installer created:
    dir /b release\CodePad-Setup-*.exe
    echo.
    echo Location: %CD%\release\
    echo.
) else (
    echo WARNING: Installer not found
    echo Check release directory manually
    dir release\
    echo.
)

pause
