#!/bin/bash
# Upload macOS build to GitHub Release

set -e

VERSION="v0.1.0"
REPO="treytomes/code-pad"
RELEASE_DIR="release"

echo "======================================"
echo "Uploading macOS Build to $VERSION"
echo "======================================"
echo ""

# Check if release exists
if ! gh release view "$VERSION" --repo "$REPO" >/dev/null 2>&1; then
    echo "❌ Error: Release $VERSION does not exist"
    echo "   Create it with: ./scripts/create-release.sh"
    exit 1
fi

# Check for macOS DMG
DMG="$RELEASE_DIR/CodePad-0.1.0.dmg"
if [ ! -f "$DMG" ]; then
    echo "❌ Error: $DMG not found"
    echo "   Build it with: npm run build"
    echo "   Then: npx electron-builder --mac dmg"
    exit 1
fi

echo "📦 Found macOS DMG:"
ls -lh "$DMG"
echo ""

# Upload DMG
echo "⬆️  Uploading macOS DMG..."
gh release upload "$VERSION" "$DMG" \
    --repo "$REPO" \
    --clobber

echo ""
echo "✅ macOS DMG uploaded successfully!"
echo ""
echo "🎉 Upload complete!"
echo ""
echo "View release:"
gh release view "$VERSION" --repo "$REPO" --web
echo ""
