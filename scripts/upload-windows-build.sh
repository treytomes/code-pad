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

# Check for Windows installer
INSTALLER="$RELEASE_DIR/CodePad-Setup-0.1.0.exe"
if [ ! -f "$INSTALLER" ]; then
    echo "❌ Error: $INSTALLER not found"
    echo "   Build it with: npm run build"
    echo "   Then: npx electron-builder --windows nsis"
    exit 1
fi

echo "📦 Found Windows installer:"
ls -lh "$INSTALLER"
echo ""

# Upload installer
echo "⬆️  Uploading Windows installer..."
gh release upload "$VERSION" "$INSTALLER" \
    --repo "$REPO" \
    --clobber

echo ""
echo "✅ Windows installer uploaded successfully!"
echo ""
echo "🎉 Upload complete!"
echo ""
echo "View release:"
gh release view "$VERSION" --repo "$REPO" --web
echo ""
