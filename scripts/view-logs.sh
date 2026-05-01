#!/bin/bash
# View CodePad logs
# Works on Linux, macOS, and WSL

# Detect platform
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Linux or WSL
    if [[ -n "$WSL_DISTRO_NAME" ]]; then
        # Running in WSL - check Windows AppData
        LOG_FILE="/mnt/c/Users/$USER/AppData/Roaming/codepad/logs/codepad.log"
    else
        LOG_FILE="$HOME/.config/codepad/logs/codepad.log"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOG_FILE="$HOME/Library/Logs/codepad/codepad.log"
else
    echo "Unknown platform: $OSTYPE"
    exit 1
fi

if [[ -f "$LOG_FILE" ]]; then
    echo "=== CodePad Logs ==="
    echo "Location: $LOG_FILE"
    echo "===================="
    echo ""

    if command -v tail &> /dev/null; then
        # Show last 50 lines and follow
        tail -n 50 -f "$LOG_FILE"
    else
        # Just cat the file
        cat "$LOG_FILE"
    fi
else
    echo "Log file not found: $LOG_FILE"
    echo ""
    echo "Expected locations:"
    echo "  Linux:   ~/.config/codepad/logs/codepad.log"
    echo "  macOS:   ~/Library/Logs/codepad/codepad.log"
    echo "  Windows: %APPDATA%\\codepad\\logs\\codepad.log"
    echo ""
    echo "The log file will be created when you run CodePad for the first time."
    exit 1
fi
