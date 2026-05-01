# Setup Python Virtual Environment for CodePad (Windows PowerShell)
# This script creates a Python venv, activates it, and installs dependencies

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CodePad - Python Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "[INFO] Found Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Python 3.8+ from:" -ForegroundColor Yellow
    Write-Host "  https://www.python.org/downloads/" -ForegroundColor White
    Write-Host ""
    Write-Host "Or install via Chocolatey:" -ForegroundColor Yellow
    Write-Host "  choco install python" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""

# Check Python version (needs 3.8+)
$versionMatch = $pythonVersion -match "Python (\d+)\.(\d+)\.(\d+)"
if ($versionMatch) {
    $major = [int]$Matches[1]
    $minor = [int]$Matches[2]

    if ($major -lt 3 -or ($major -eq 3 -and $minor -lt 8)) {
        Write-Host "[ERROR] Python 3.8+ is required (found $major.$minor)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please upgrade Python:" -ForegroundColor Yellow
        Write-Host "  https://www.python.org/downloads/" -ForegroundColor White
        Write-Host ""
        exit 1
    }
}

# Check if virtual environment exists
if (Test-Path "venv-win\Scripts\Activate.ps1") {
    Write-Host "[INFO] Virtual environment already exists" -ForegroundColor Yellow
} else {
    Write-Host "[INFO] Creating virtual environment..." -ForegroundColor Cyan
    python -m venv venv-win

    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }

    Write-Host "[SUCCESS] Virtual environment created" -ForegroundColor Green
}

Write-Host ""

# Activate virtual environment
Write-Host "[INFO] Activating virtual environment..." -ForegroundColor Cyan

# For PowerShell, we need to source the activation script
& ".\venv-win\Scripts\Activate.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to activate virtual environment" -ForegroundColor Red
    Write-Host ""
    Write-Host "If you see an execution policy error, run:" -ForegroundColor Yellow
    Write-Host "  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "[SUCCESS] Virtual environment activated" -ForegroundColor Green
Write-Host ""

# Upgrade pip
Write-Host "[INFO] Upgrading pip..." -ForegroundColor Cyan
python -m pip install --upgrade pip --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] pip upgraded" -ForegroundColor Green
} else {
    Write-Host "[WARNING] pip upgrade failed (continuing anyway)" -ForegroundColor Yellow
}

Write-Host ""

# Check for requirements.txt and install
if (Test-Path "requirements.txt") {
    Write-Host "[INFO] Found requirements.txt, installing packages..." -ForegroundColor Cyan
    pip install -r requirements.txt

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] All requirements installed" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Some packages failed to install" -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] No requirements.txt found (this is normal for now)" -ForegroundColor Yellow
}

Write-Host ""

# Set environment variable for npm
$pythonPath = Join-Path $PSScriptRoot "venv-win\Scripts\python.exe"
$env:PYTHON = $pythonPath
Write-Host "[INFO] Set PYTHON=$pythonPath" -ForegroundColor Cyan
Write-Host ""

# Display summary
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Virtual environment: " -NoNewline
Write-Host "venv-win\" -ForegroundColor Cyan
Write-Host "Python executable: " -NoNewline
Write-Host "$pythonPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment variables set for this session:" -ForegroundColor Yellow
Write-Host "  PYTHON = $pythonPath" -ForegroundColor White
Write-Host ""
Write-Host "You can now run:" -ForegroundColor Yellow
Write-Host "  npm install       " -NoNewline -ForegroundColor White
Write-Host "- Install Node.js dependencies" -ForegroundColor Gray
Write-Host "  npm run build     " -NoNewline -ForegroundColor White
Write-Host "- Build the application" -ForegroundColor Gray
Write-Host "  npm run electron:dev " -NoNewline -ForegroundColor White
Write-Host "- Run Electron in dev mode" -ForegroundColor Gray
Write-Host ""
Write-Host "To use this Python in future sessions, run:" -ForegroundColor Yellow
Write-Host "  .\setup-python.ps1" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
