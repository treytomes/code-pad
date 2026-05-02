#!/bin/bash
# Create GitHub Release for CodePad v0.1.0

set -e

VERSION="v0.1.0"
REPO="treytomes/code-pad"
RELEASE_NOTES="RELEASE_NOTES_v0.1.0.md"

echo "======================================"
echo "Creating CodePad v0.1.0 GitHub Release"
echo "======================================"
echo ""

# Check if release notes exist
if [ ! -f "$RELEASE_NOTES" ]; then
    echo "❌ Error: $RELEASE_NOTES not found"
    exit 1
fi

# Check if tag exists
if ! git rev-parse "$VERSION" >/dev/null 2>&1; then
    echo "❌ Error: Git tag $VERSION does not exist"
    echo "   Create it with: git tag -a $VERSION -m 'Release $VERSION'"
    exit 1
fi

# Check if release already exists
if gh release view "$VERSION" --repo "$REPO" >/dev/null 2>&1; then
    echo "⚠️  Release $VERSION already exists"
    echo ""
    read -p "Do you want to delete and recreate it? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Deleting existing release..."
        gh release delete "$VERSION" --repo "$REPO" --yes
    else
        echo "❌ Aborted"
        exit 1
    fi
fi

echo "📝 Creating GitHub release..."
gh release create "$VERSION" \
    --repo "$REPO" \
    --title "CodePad v0.1.0 - Pre-Release" \
    --notes-file "$RELEASE_NOTES" \
    --prerelease

echo ""
echo "✅ Release created successfully!"
echo ""
echo "📦 Release URL:"
gh release view "$VERSION" --repo "$REPO" --web
echo ""
echo "Next steps:"
echo "1. Upload Linux build: ./scripts/upload-linux-build.sh"
echo "2. Upload Windows build: ./scripts/upload-windows-build.sh (from Windows)"
echo "3. Upload macOS build: ./scripts/upload-macos-build.sh (from macOS)"
echo ""
