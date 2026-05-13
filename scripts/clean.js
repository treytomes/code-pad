#!/usr/bin/env node
/**
 * Cross-platform clean script
 * Removes dist and release directories
 */

const fs = require('fs');
const path = require('path');

function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    console.log(`Removing ${dirPath}...`);
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`✓ Removed ${dirPath}`);
  } else {
    console.log(`✓ ${dirPath} doesn't exist (skipped)`);
  }
}

const projectRoot = path.join(__dirname, '..');
const distPath = path.join(projectRoot, 'dist');
const releasePath = path.join(projectRoot, 'release');

console.log('Cleaning build artifacts...');
removeDir(distPath);
removeDir(releasePath);
console.log('Clean complete!');
