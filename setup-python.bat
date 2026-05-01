@echo off
REM Setup Python Virtual Environment for CodePad (Windows)
REM This script creates a Python venv, activates it, and installs dependencies

echo ========================================
echo CodePad - Python Environment Setup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo.
    echo Please install Python 3.8+ from:
    echo   https://www.python.org/downloads/
    echo.
    echo Or install via Chocolatey:
    echo   choco install python
    echo.
    pause
    exit /b 1
)

REM Display Python version
echo [INFO] Found Python:
python --version
echo.

REM Check if virtual environment exists
if exist "venv-win\Scripts\activate.bat" (
    echo [INFO] Virtual environment already exists
) else (
    echo [INFO] Creating virtual environment...
    python -m venv venv-win

    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )

    echo [SUCCESS] Virtual environment created
)
echo.

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv-win\Scripts\activate.bat

if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)

echo [SUCCESS] Virtual environment activated
echo.

REM Upgrade pip
echo [INFO] Upgrading pip...
python -m pip install --upgrade pip --quiet

REM Check for requirements.txt and install
if exist "requirements.txt" (
    echo [INFO] Found requirements.txt, installing packages...
    pip install -r requirements.txt

    if errorlevel 1 (
        echo [WARNING] Some packages failed to install
    ) else (
        echo [SUCCESS] All requirements installed
    )
    echo.
) else (
    echo [INFO] No requirements.txt found (this is normal for now)
    echo.
)

REM Set environment variable for npm
set PYTHON=%CD%\venv-win\Scripts\python.exe
echo [INFO] Set PYTHON=%PYTHON%
echo.

REM Display summary
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Virtual environment: venv-win\
echo Python executable: %PYTHON%
echo.
echo Environment variables set for this session:
echo   PYTHON = %PYTHON%
echo.
echo You can now run:
echo   npm install       - Install Node.js dependencies
echo   npm run build     - Build the application
echo   npm run electron:dev - Run Electron in dev mode
echo.
echo To use this Python in future sessions, run:
echo   setup-python.bat
echo.
echo ========================================
