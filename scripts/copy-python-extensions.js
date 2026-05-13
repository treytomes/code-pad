const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, '../src/backend/executors/python-dump.py');
const destDir = path.join(__dirname, '../dist/backend/executors');
const destFile = path.join(destDir, 'python-dump.py');

// Ensure destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy file
fs.copyFileSync(srcFile, destFile);

console.log('Copied python-dump.py to dist/backend/executors/');
