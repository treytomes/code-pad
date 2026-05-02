@echo off
REM Upload Windows build to GitHub Release

setlocal enabledelayedexpansion

set VERSION=v0.1.0
set REPO=treytomes/code-pad
set RELEASE_DIR=release

echo ======================================
echo Uploading Windows Build to %VERSION%
echo ======================================
echo.

REM Check if release exists
gh release view %VERSION% --repo %REPO% >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Release %VERSION% does not exist
    echo    Create it with: bash scripts/create-release.sh
    exit /b 1
)

REM Check for Windows installer
set INSTALLER=%RELEASE_DIR%\CodePad-Setup-0.1.0.exe
if not exist "%INSTALLER%" (
    echo ❌ Error: %INSTALLER% not found
    echo    Build it with: npm run build
    echo    Then: npx electron-builder --windows nsis
    exit /b 1
)

echo 📦 Found Windows installer:
dir "%INSTALLER%" | findstr /R /C:"CodePad-Setup"
echo.

REM Upload installer
echo ⬆️  Uploading Windows installer...
gh release upload %VERSION% "%INSTALLER%" --repo %REPO% --clobber

if errorlevel 1 (
    echo ❌ Upload failed
    exit /b 1
)

echo.
echo ✅ Windows installer uploaded successfully!
echo.
echo 🎉 Upload complete!
echo.
echo View release:
gh release view %VERSION% --repo %REPO% --web
echo.

endlocal
