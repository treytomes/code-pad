@echo off
REM Build installer without code signing tools
REM This avoids the symbolic link permission errors

echo ========================================
echo CodePad - Build Without Code Signing
echo ========================================
echo.

echo Setting environment to skip code signing...
echo.

REM Set environment variables to disable code signing completely
set CSC_IDENTITY_AUTO_DISCOVERY=false
set WIN_CSC_LINK=
set WIN_CSC_KEY_PASSWORD=

echo Building installer (no code signing)...
echo.

call npm run electron:build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Build still failed
    echo.
    echo The symbolic link error persists. You need to:
    echo.
    echo   Option 1 - Enable Developer Mode (RECOMMENDED):
    echo     1. Open Settings
    echo     2. Go to: Update ^& Security ^> For developers
    echo     3. Turn ON "Developer Mode"
    echo     4. Restart this command prompt
    echo     5. Run this script again
    echo.
    echo   Option 2 - Run as Administrator:
    echo     1. Right-click Command Prompt
    echo     2. Select "Run as administrator"
    echo     3. Navigate to: cd %CD%
    echo     4. Run: npm run electron:build
    echo.
    pause
    exit /b 1
)

echo.
echo SUCCESS! Checking output...
if exist "release\CodePad-Setup-*.exe" (
    echo.
    echo Installer created:
    dir /b release\CodePad-Setup-*.exe
    echo.
    echo Location: %CD%\release\
    echo.
) else (
    echo No installer found. Check release directory:
    dir release\
)

pause
