@echo off
REM Build Windows installer for CodePad
REM Run this from Windows Command Prompt (not WSL)

echo ========================================
echo CodePad Windows Installer Build Script
echo ========================================
echo.

REM Check if Node.js is available
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

echo npm version:
npm --version
echo.

REM Step 1: Install dependencies
echo [Step 1/3] Installing dependencies...
echo This may take a few minutes...
echo.
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed
    echo.
    echo If you see Python/gyp errors for better-sqlite3, try:
    echo   npm install --build-from-source
    echo.
    echo Or install Python 3.11 from https://www.python.org/downloads/
    pause
    exit /b 1
)
echo.

REM Step 2: Clean and build
echo [Step 2/3] Building application...
echo.
call npm run build:prod
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo.

REM Step 3: Verify output
echo [Step 3/3] Verifying output...
echo.
if exist "release\CodePad-Setup-0.1.0.exe" (
    echo SUCCESS! Installer created:
    echo   release\CodePad-Setup-0.1.0.exe
    echo.
    dir release\CodePad-Setup-*.exe
    echo.
    echo You can now:
    echo   1. Test the installer by running it
    echo   2. Upload to GitHub Releases
    echo   3. Distribute to users
) else (
    echo WARNING: Installer not found in release directory
    echo Check for errors above
    dir release\
)
echo.

pause
