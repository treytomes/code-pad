@echo off
REM Complete Development Environment Setup for CodePad (Windows)
REM This script sets up Python venv, installs npm dependencies, and builds the app

echo ========================================
echo CodePad - Complete Dev Setup
echo ========================================
echo.

REM Step 1: Setup Python environment
echo [STEP 1/3] Setting up Python environment...
echo ========================================
call setup-python.bat
if errorlevel 1 (
    echo.
    echo [ERROR] Python setup failed
    pause
    exit /b 1
)

echo.
echo.

REM Step 2: Install npm dependencies
echo [STEP 2/3] Installing npm dependencies...
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from:
    echo   https://nodejs.org/
    echo.
    echo Or install via Chocolatey:
    echo   choco install nodejs-lts
    echo.
    pause
    exit /b 1
)

echo [INFO] Found Node.js:
node --version
echo.

echo [INFO] Found npm:
call npm --version
echo.

REM Clean install if node_modules exists
if exist "node_modules\" (
    echo [INFO] Removing old node_modules...
    rmdir /s /q node_modules 2>nul
)

if exist "package-lock.json" (
    echo [INFO] Removing package-lock.json...
    del /f /q package-lock.json 2>nul
)

echo [INFO] Running npm install...
echo (This may take a few minutes...)
echo.

call npm install

if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed
    echo.
    echo Check the error messages above for details.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] npm dependencies installed
echo.
echo.

REM Step 3: Build the application
echo [STEP 3/3] Building application...
echo ========================================
echo.

call npm run build

if errorlevel 1 (
    echo.
    echo [ERROR] Build failed
    echo.
    echo Check the error messages above for details.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Build completed successfully
echo.

REM Display final summary
echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo All steps completed successfully:
echo   [x] Python virtual environment created
echo   [x] npm dependencies installed
echo   [x] Application built
echo.
echo Build output location:
echo   dist\main\      - Main process
echo   dist\preload\   - Preload script
echo   dist\renderer\  - React app
echo.
echo To run the application:
echo   npm run electron:dev
echo.
echo To rebuild after making changes:
echo   npm run build
echo.
echo ========================================
echo.
pause
