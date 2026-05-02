#!/bin/bash
# Generate application icons from SVG source
# Requires: imagemagick (for convert) and librsvg (for rsvg-convert)
#
# Install on Ubuntu/WSL:
#   sudo apt-get install imagemagick librsvg2-bin
# Install on macOS:
#   brew install imagemagick librsvg

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ASSETS_DIR="$PROJECT_ROOT/assets"
SVG_FILE="$ASSETS_DIR/icon.svg"

# Check if SVG exists
if [ ! -f "$SVG_FILE" ]; then
  echo "Error: icon.svg not found at $SVG_FILE"
  exit 1
fi

# Check for required tools
if ! command -v rsvg-convert &> /dev/null; then
  echo "Error: rsvg-convert not found. Please install librsvg2-bin"
  echo "  Ubuntu/WSL: sudo apt-get install librsvg2-bin"
  echo "  macOS: brew install librsvg"
  exit 1
fi

if ! command -v convert &> /dev/null; then
  echo "Error: convert (ImageMagick) not found. Please install imagemagick"
  echo "  Ubuntu/WSL: sudo apt-get install imagemagick"
  echo "  macOS: brew install imagemagick"
  exit 1
fi

echo "Generating icons from $SVG_FILE..."

# Create temporary directory for PNGs
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

# Generate PNG files at various sizes
echo "Generating PNG files..."
for size in 16 32 48 64 128 256 512 1024; do
  echo "  ${size}x${size}..."
  rsvg-convert -w $size -h $size "$SVG_FILE" -o "$TMP_DIR/icon-${size}.png"
done

# Generate .ico for Windows (16, 32, 48, 256)
echo "Generating Windows .ico file..."
convert "$TMP_DIR/icon-16.png" \
        "$TMP_DIR/icon-32.png" \
        "$TMP_DIR/icon-48.png" \
        "$TMP_DIR/icon-256.png" \
        "$ASSETS_DIR/icon.ico"
echo "  Created: $ASSETS_DIR/icon.ico"

# Generate .icns for macOS (requires multiple sizes)
echo "Generating macOS .icns file..."
ICONSET_DIR="$TMP_DIR/icon.iconset"
mkdir -p "$ICONSET_DIR"

# macOS iconset requires specific naming
cp "$TMP_DIR/icon-16.png" "$ICONSET_DIR/icon_16x16.png"
cp "$TMP_DIR/icon-32.png" "$ICONSET_DIR/icon_16x16@2x.png"
cp "$TMP_DIR/icon-32.png" "$ICONSET_DIR/icon_32x32.png"
cp "$TMP_DIR/icon-64.png" "$ICONSET_DIR/icon_32x32@2x.png"
cp "$TMP_DIR/icon-128.png" "$ICONSET_DIR/icon_128x128.png"
cp "$TMP_DIR/icon-256.png" "$ICONSET_DIR/icon_128x128@2x.png"
cp "$TMP_DIR/icon-256.png" "$ICONSET_DIR/icon_256x256.png"
cp "$TMP_DIR/icon-512.png" "$ICONSET_DIR/icon_256x256@2x.png"
cp "$TMP_DIR/icon-512.png" "$ICONSET_DIR/icon_512x512.png"
cp "$TMP_DIR/icon-1024.png" "$ICONSET_DIR/icon_512x512@2x.png"

if command -v iconutil &> /dev/null; then
  # On macOS, use iconutil
  iconutil -c icns "$ICONSET_DIR" -o "$ASSETS_DIR/icon.icns"
  echo "  Created: $ASSETS_DIR/icon.icns"
else
  # On Linux, use png2icns (if available) or just copy largest PNG
  if command -v png2icns &> /dev/null; then
    png2icns "$ASSETS_DIR/icon.icns" "$TMP_DIR/icon-"*.png
    echo "  Created: $ASSETS_DIR/icon.icns"
  else
    echo "  Warning: iconutil/png2icns not available. Copying icon.png instead."
    cp "$TMP_DIR/icon-512.png" "$ASSETS_DIR/icon.png"
  fi
fi

# Copy PNG files for Linux
echo "Copying PNG files for Linux..."
for size in 16 32 48 64 128 256 512; do
  cp "$TMP_DIR/icon-${size}.png" "$ASSETS_DIR/icon-${size}x${size}.png"
done
echo "  Created: $ASSETS_DIR/icon-*.png"

# Copy main icon
cp "$TMP_DIR/icon-512.png" "$ASSETS_DIR/icon.png"

echo ""
echo "✅ Icon generation complete!"
echo "Generated files in $ASSETS_DIR:"
ls -lh "$ASSETS_DIR"/icon.*
