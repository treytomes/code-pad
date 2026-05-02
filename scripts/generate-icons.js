#!/usr/bin/env node
/**
 * Generate application icons from SVG source
 * Uses Node.js packages (sharp, svg2img) - no system dependencies required
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const svg2img = require('svg2img');
const { promisify } = require('util');

const svg2imgAsync = promisify(svg2img);

const SVG_PATH = path.join(__dirname, '../assets/icon.svg');
const ASSETS_DIR = path.join(__dirname, '../assets');

// Icon sizes needed
const SIZES = [16, 32, 48, 64, 128, 256, 512, 1024];

async function generatePNG(svgBuffer, size) {
  console.log(`  Generating ${size}x${size}...`);

  try {
    // Convert SVG to PNG at specified size
    const pngBuffer = await svg2imgAsync(svgBuffer, {
      width: size,
      height: size,
      format: 'png'
    });

    return pngBuffer;
  } catch (error) {
    console.error(`  Error generating ${size}x${size}:`, error.message);
    throw error;
  }
}

async function generateICO(pngBuffers) {
  console.log('Generating Windows .ico file...');

  // For .ico, we need 16, 32, 48, 256
  const icoSizes = [16, 32, 48, 256];
  const icoBuffers = icoSizes.map(size => {
    const buffer = pngBuffers[size];
    if (!buffer) {
      throw new Error(`Missing PNG buffer for size ${size}`);
    }
    return buffer;
  });

  // Simple ICO format: just concatenate PNGs with headers
  // For now, save the 256x256 as icon.ico (electron-builder will handle multi-size)
  const icoPath = path.join(ASSETS_DIR, 'icon.ico');
  fs.writeFileSync(icoPath, pngBuffers[256]);
  console.log(`  Created: ${icoPath}`);
}

async function generateICNS(pngBuffers) {
  console.log('Generating macOS .icns file...');

  // macOS iconset requires specific sizes and naming
  const iconsetDir = path.join(ASSETS_DIR, 'icon.iconset');

  // Create iconset directory
  if (!fs.existsSync(iconsetDir)) {
    fs.mkdirSync(iconsetDir, { recursive: true });
  }

  // macOS iconset naming convention
  const iconsetFiles = [
    { size: 16, name: 'icon_16x16.png' },
    { size: 32, name: 'icon_16x16@2x.png' },
    { size: 32, name: 'icon_32x32.png' },
    { size: 64, name: 'icon_32x32@2x.png' },
    { size: 128, name: 'icon_128x128.png' },
    { size: 256, name: 'icon_128x128@2x.png' },
    { size: 256, name: 'icon_256x256.png' },
    { size: 512, name: 'icon_256x256@2x.png' },
    { size: 512, name: 'icon_512x512.png' },
    { size: 1024, name: 'icon_512x512@2x.png' },
  ];

  iconsetFiles.forEach(({ size, name }) => {
    const buffer = pngBuffers[size];
    if (buffer) {
      fs.writeFileSync(path.join(iconsetDir, name), buffer);
    }
  });

  console.log(`  Created iconset: ${iconsetDir}`);
  console.log(`  Note: Run 'iconutil -c icns ${iconsetDir}' on macOS to generate .icns`);

  // For non-macOS systems, just save the 512x512 as icon.icns placeholder
  const icnsPath = path.join(ASSETS_DIR, 'icon.icns');
  fs.writeFileSync(icnsPath, pngBuffers[512]);
  console.log(`  Created placeholder: ${icnsPath}`);
}

async function main() {
  console.log('Generating icons from SVG...\n');

  // Read SVG file
  if (!fs.existsSync(SVG_PATH)) {
    console.error(`Error: ${SVG_PATH} not found`);
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(SVG_PATH);
  console.log(`Source: ${SVG_PATH}\n`);

  // Generate PNGs for all sizes
  console.log('Generating PNG files...');
  const pngBuffers = {};

  for (const size of SIZES) {
    const buffer = await generatePNG(svgBuffer, size);
    pngBuffers[size] = buffer;

    // Save individual PNG files
    const pngPath = path.join(ASSETS_DIR, `icon-${size}x${size}.png`);
    fs.writeFileSync(pngPath, buffer);
  }

  // Save main icon.png (512x512)
  const mainIconPath = path.join(ASSETS_DIR, 'icon.png');
  fs.writeFileSync(mainIconPath, pngBuffers[512]);
  console.log(`  Created: ${mainIconPath}\n`);

  // Generate .ico for Windows
  await generateICO(pngBuffers);
  console.log();

  // Generate .icns for macOS
  await generateICNS(pngBuffers);
  console.log();

  console.log('✅ Icon generation complete!\n');
  console.log('Generated files in assets/:');
  console.log('  - icon.png (main 512x512)');
  console.log('  - icon-{16,32,48,64,128,256,512,1024}x{size}.png');
  console.log('  - icon.ico (Windows)');
  console.log('  - icon.icns (macOS placeholder)');
  console.log('  - icon.iconset/ (macOS iconset directory)');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
