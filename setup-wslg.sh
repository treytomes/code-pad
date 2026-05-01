#!/bin/bash
# Setup WSLg dependencies for Electron

set -e

echo "========================================="
echo "CodePad - WSLg Setup for Electron"
echo "========================================="
echo ""

# Check if WSLg is available
if [ -z "$DISPLAY" ]; then
    echo "❌ ERROR: DISPLAY variable not set"
    echo "   WSLg may not be available on your Windows version"
    echo "   Requires Windows 11 or Windows 10 Build 19044+"
    exit 1
fi

echo "✅ WSLg detected: DISPLAY=$DISPLAY"
echo ""

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  This script requires sudo to install system packages"
    echo "   Please run: sudo ./setup-wslg.sh"
    echo ""
    echo "   Or manually install packages:"
    echo "   sudo dnf install -y gtk3 libXScrnSaver libXtst nss at-spi2-atk cups-libs libdrm mesa-libgbm alsa-lib"
    exit 1
fi

echo "📦 Installing Electron dependencies..."
echo ""

# Install required packages
dnf install -y \
    gtk3 \
    libXScrnSaver \
    libXtst \
    nss \
    at-spi2-atk \
    cups-libs \
    libdrm \
    mesa-libgbm \
    alsa-lib \
    libatomic

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "🧪 Testing Electron..."
echo ""

# Switch back to original user and test
ORIGINAL_USER=${SUDO_USER:-$USER}
ORIGINAL_HOME=$(eval echo ~$ORIGINAL_USER)
cd "$ORIGINAL_HOME/projects/code-pad"

# Test Electron as the original user
su - $ORIGINAL_USER -c "cd $ORIGINAL_HOME/projects/code-pad && npm run electron:dev" &
ELECTRON_PID=$!

echo "   Electron PID: $ELECTRON_PID"
echo "   Waiting 5 seconds..."
sleep 5

# Check if process is still running
if ps -p $ELECTRON_PID > /dev/null 2>&1; then
    echo ""
    echo "✅ SUCCESS! Electron is running!"
    echo ""
    echo "   You should see a window on your screen."
    echo "   Close the window or press Ctrl+C to stop."
    echo ""
    wait $ELECTRON_PID
else
    echo ""
    echo "❌ Electron failed to start. Check the error messages above."
    echo ""
    exit 1
fi

echo ""
echo "========================================="
echo "Setup complete! You can now run:"
echo "  npm run electron:dev"
echo "========================================="
