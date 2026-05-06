@echo off
REM Fix NSIS cache issue and rebuild installer

echo ========================================
echo CodePad - Fix NSIS Cache and Rebuild
echo ========================================
echo.

echo This script will:
echo   1. Clear electron-builder cache
echo   2. Rebuild the installer with fresh NSIS download
echo.
pause

echo [Step 1/2] Clearing electron-builder cache...
echo.

REM Clear the electron-builder cache
rd /s /q "%LOCALAPPDATA%\electron-builder\Cache" 2>nul
if exist "%LOCALAPPDATA%\electron-builder\Cache" (
    echo WARNING: Could not fully clear cache
    echo Please close any applications using electron-builder files
    pause
) else (
    echo Cache cleared successfully
)
echo.

echo [Step 2/2] Rebuilding installer...
echo This will download fresh NSIS binaries (~10MB)
echo.

REM Rebuild just the installer
call npm run electron:build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Build failed
    echo.
    echo If you see "Plugin not found" errors again:
    echo   1. Delete: %LOCALAPPDATA%\electron-builder\Cache
    echo   2. Check internet connection (needs to download NSIS)
    echo   3. Try running as Administrator
    echo.
    pause
    exit /b 1
)

echo.
echo [Success] Checking for installer...
if exist "release\CodePad-Setup-*.exe" (
    echo.
    echo SUCCESS! Installer created:
    dir /b release\CodePad-Setup-*.exe
    echo.
    for %%F in (release\CodePad-Setup-*.exe) do (
        echo Size:
        dir "%%F" | findstr "CodePad"
    )
    echo.
    echo Location: %CD%\release\
    echo.
) else (
    echo WARNING: Installer not found in release directory
    echo.
    echo Files created:
    dir release\
    echo.
)

pause
