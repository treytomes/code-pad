#!/usr/bin/env node

/**
 * Electron Debug Wrapper
 *
 * This script wraps the Electron process for VS Code debugging.
 * It ensures the debugger properly detects when Electron exits.
 *
 * Usage: node .vscode/electron-debug.js
 */

const { spawn } = require('child_process');
const path = require('path');

// Determine Electron executable path based on platform
const electronPath = process.platform === 'win32'
  ? path.join(__dirname, '../node_modules/electron/dist/electron.exe')
  : path.join(__dirname, '../node_modules/.bin/electron');

// Arguments for Electron
const args = [
  '--remote-debugging-port=9222',
  '.'
];

// Environment variables
const env = {
  ...process.env,
  NODE_ENV: 'development'
};

console.log('[Electron Debug Wrapper] Starting Electron...');
console.log('[Electron Debug Wrapper] Executable:', electronPath);
console.log('[Electron Debug Wrapper] Args:', args);

// Spawn Electron process
const electronProcess = spawn(electronPath, args, {
  cwd: path.join(__dirname, '..'),
  env,
  stdio: 'inherit', // Pass through stdin/stdout/stderr
  windowsHide: false
});

// Handle process exit
electronProcess.on('exit', (code, signal) => {
  console.log(`[Electron Debug Wrapper] Electron exited with code ${code}, signal ${signal}`);

  // Exit this wrapper with the same code
  process.exit(code || 0);
});

// Handle errors
electronProcess.on('error', (err) => {
  console.error('[Electron Debug Wrapper] Failed to start Electron:', err);
  process.exit(1);
});

// Handle signals to properly terminate Electron
function handleSignal(signal) {
  console.log(`[Electron Debug Wrapper] Received ${signal}, terminating Electron...`);

  // Try graceful shutdown first
  electronProcess.kill('SIGTERM');

  // Force kill after timeout
  setTimeout(() => {
    if (!electronProcess.killed) {
      console.log('[Electron Debug Wrapper] Force killing Electron...');
      electronProcess.kill('SIGKILL');
    }
  }, 2000);
}

process.on('SIGINT', () => handleSignal('SIGINT'));
process.on('SIGTERM', () => handleSignal('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[Electron Debug Wrapper] Uncaught exception:', err);
  electronProcess.kill();
  process.exit(1);
});

// Ensure cleanup on exit
process.on('exit', () => {
  if (!electronProcess.killed) {
    electronProcess.kill();
  }
});
