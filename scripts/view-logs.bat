@echo off
REM View CodePad logs on Windows

set LOG_FILE=%APPDATA%\codepad\logs\codepad.log

if exist "%LOG_FILE%" (
    echo === CodePad Logs ===
    echo Location: %LOG_FILE%
    echo ====================
    echo.

    REM Check if Get-Content (PowerShell) is available
    where powershell >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        REM Use PowerShell to tail the file
        powershell -Command "Get-Content '%LOG_FILE%' -Wait -Tail 50"
    ) else (
        REM Fallback to type
        type "%LOG_FILE%"
    )
) else (
    echo Log file not found: %LOG_FILE%
    echo.
    echo The log file will be created when you run CodePad for the first time.
    pause
)
