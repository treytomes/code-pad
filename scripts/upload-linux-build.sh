#!/bin/bash
# Upload Linux builds to GitHub Release

set -e

VERSION="v0.1.0"
REPO="treytomes/code-pad"
RELEASE_DIR="release"

echo "======================================"
echo "Uploading Linux Builds to $VERSION"
echo "======================================"
echo ""

# Check if release exists
if ! gh release view "$VERSION" --repo "$REPO" >/dev/null 2>&1; then
    echo "❌ Error: Release $VERSION does not exist"
    echo "   Create it with: ./scripts/create-release.sh"
    exit 1
fi

# Check for Linux AppImage
APPIMAGE="$RELEASE_DIR/CodePad-0.1.0.AppImage"
if [ ! -f "$APPIMAGE" ]; then
    echo "❌ Error: $APPIMAGE not found"
    echo "   Build it with: npm run build && npx electron-builder --linux AppImage"
    exit 1
fi

echo "📦 Found Linux builds:"
ls -lh "$APPIMAGE"
echo ""

# Upload AppImage
echo "⬆️  Uploading AppImage..."
gh release upload "$VERSION" "$APPIMAGE" \
    --repo "$REPO" \
    --clobber

echo ""
echo "✅ Linux AppImage uploaded successfully!"
echo ""

# Check for .deb (optional)
DEB="$RELEASE_DIR/CodePad_0.1.0_amd64.deb"
if [ -f "$DEB" ]; then
    echo "📦 Found .deb package:"
    ls -lh "$DEB"
    echo ""
    read -p "Upload .deb package as well? (Y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        echo "⬆️  Uploading .deb..."
        gh release upload "$VERSION" "$DEB" \
            --repo "$REPO" \
            --clobber
        echo ""
        echo "✅ .deb package uploaded successfully!"
    fi
else
    echo "ℹ️  No .deb package found (this is optional)"
    echo "   To build: npm pkg set 'author.email=codepad@example.com'"
    echo "   Then: npx electron-builder --linux deb"
fi

echo ""
echo "🎉 Linux build(s) uploaded!"
echo ""
echo "View release:"
gh release view "$VERSION" --repo "$REPO" --web
echo ""
