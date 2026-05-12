#!/bin/bash
# Upload Windows build to GitHub Release (PowerShell/Git Bash compatible)

set -e

VERSION="v0.1.0"
REPO="treytomes/code-pad"
RELEASE_DIR="release"

echo "======================================"
echo "Uploading Windows Build to $VERSION"
echo "======================================"
echo ""

# Check if release exists
if ! gh release view "$VERSION" --repo "$REPO" >/dev/null 2>&1; then
    echo "❌ Error: Release $VERSION does not exist"
    echo "   Create it with: bash scripts/create-release.sh"
    exit 1
fi

# Check for Windows build (zip or exe)
ZIP="$RELEASE_DIR/CodePad-0.1.0-win.zip"
INSTALLER="$RELEASE_DIR/CodePad-Setup-0.1.0.exe"

if [ -f "$ZIP" ]; then
    BUILD_FILE="$ZIP"
    BUILD_TYPE="portable zip"
elif [ -f "$INSTALLER" ]; then
    BUILD_FILE="$INSTALLER"
    BUILD_TYPE="installer"
else
    echo "❌ Error: No Windows build found"
    echo "   Expected: $ZIP or $INSTALLER"
    echo "   Build with: npm run build"
    echo "   Then: npx electron-builder --config electron-builder-nosign.json"
    exit 1
fi

echo "📦 Found Windows $BUILD_TYPE:"
ls -lh "$BUILD_FILE"
echo ""

# Upload build
echo "⬆️  Uploading Windows $BUILD_TYPE..."
gh release upload "$VERSION" "$BUILD_FILE" \
    --repo "$REPO" \
    --clobber

echo ""
echo "✅ Windows $BUILD_TYPE uploaded successfully!"
echo ""
echo "🎉 Upload complete!"
echo ""
echo "View release:"
gh release view "$VERSION" --repo "$REPO" --web
echo ""
