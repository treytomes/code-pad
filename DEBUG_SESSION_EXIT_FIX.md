# Debug Session Exit Fix

**Issue**: Closing Electron window doesn't end VS Code debug session  
**Date**: 2026-05-01  
**Solution**: Electron debug wrapper script

---

## The Problem

When debugging Electron with VS Code:

1. ✅ Press F5 → Electron launches
2. ✅ Set breakpoints → They work
3. ✅ Debug code → Works perfectly
4. ❌ Close Electron → **Debug session continues!**

**Result**: Red stop button still active, debugger still attached

---

## Root Cause

### Electron's Multi-Process Architecture

Electron spawns multiple processes:
```
Main Electron Process (parent)
├── GPU Process
├── Renderer Process (Chromium)
├── Utility Process
└── Other helper processes
```

**The Issue**:
- VS Code debugger attaches to the **main process**
- When you close the Electron window, the main process exits
- But **child processes** may still be running (cleanup delay)
- VS Code waits for ALL processes to exit before stopping
- Can hang for 10-30 seconds

---

## The Solution

### Wrapper Script Approach

Created `.vscode/electron-debug.js` that:

1. ✅ Spawns Electron as a child process
2. ✅ Passes through stdin/stdout/stderr
3. ✅ Listens for Electron exit
4. ✅ Exits wrapper when Electron exits
5. ✅ Handles SIGINT/SIGTERM properly
6. ✅ Force kills if graceful shutdown fails

**Key Insight**: VS Code attaches to the wrapper (Node.js), not Electron directly.
When the wrapper exits, VS Code immediately stops the debug session.

---

## Implementation

### 1. Electron Debug Wrapper Script

**File**: `.vscode/electron-debug.js`

```javascript
const { spawn } = require('child_process');

// Spawn Electron
const electronProcess = spawn(electronPath, args, {
  stdio: 'inherit'
});

// Exit wrapper when Electron exits
electronProcess.on('exit', (code) => {
  process.exit(code || 0);
});

// Handle signals (Ctrl+C, debugger stop)
process.on('SIGINT', () => {
  electronProcess.kill('SIGTERM');
  // Force kill after 2 seconds
  setTimeout(() => {
    electronProcess.kill('SIGKILL');
  }, 2000);
});
```

**Features**:
- ✅ Cross-platform (Windows, Linux, macOS)
- ✅ Proper signal handling
- ✅ Graceful shutdown with fallback
- ✅ Logs to console for debugging
- ✅ Passes through all I/O

---

### 2. Updated launch.json

**Before**:
```json
{
  "name": "Debug Main Process",
  "type": "node",
  "runtimeExecutable": "${workspaceFolder}/node_modules/electron/dist/electron.exe",
  "args": ["--remote-debugging-port=9222", "."]
}
```

**After**:
```json
{
  "name": "Debug Main Process",
  "type": "node",
  "runtimeExecutable": "node",
  "program": "${workspaceFolder}/.vscode/electron-debug.js"
}
```

**Change**: Debug the wrapper (Node.js) instead of Electron directly.

---

## How It Works

### Architecture

```
VS Code Debugger
    ↓ (attaches to)
Node.js Process (.vscode/electron-debug.js)
    ↓ (spawns)
Electron Main Process
    ↓ (spawns)
Electron Child Processes (GPU, Renderer, etc.)
```

### Exit Flow

```
1. User closes Electron window
   ↓
2. Electron main process exits (app.quit())
   ↓
3. electronProcess.on('exit') fires in wrapper
   ↓
4. Wrapper calls process.exit(code)
   ↓
5. VS Code detects wrapper exit
   ↓
6. Debug session stops immediately ✅
```

### Signal Flow (Stop Button)

```
1. User clicks Stop button in VS Code
   ↓
2. VS Code sends SIGTERM to wrapper
   ↓
3. Wrapper catches signal, forwards to Electron
   ↓
4. Electron exits gracefully
   ↓
5. Wrapper exits
   ↓
6. Debug session stops ✅
```

---

## Testing

### Test 1: Normal Exit (Close Window)

1. Start debugging (F5)
2. Electron window opens
3. Close Electron window (X button)

**Expected**:
- ✅ Debug session stops within 1-2 seconds
- ✅ Console shows: `[Electron Debug Wrapper] Electron exited with code 0`
- ✅ Red stop button disappears

---

### Test 2: Debug Stop Button

1. Start debugging (F5)
2. Electron window opens
3. Click red Stop button in VS Code

**Expected**:
- ✅ Electron window closes
- ✅ Debug session stops immediately
- ✅ Console shows: `[Electron Debug Wrapper] Received SIGTERM`

---

### Test 3: Ctrl+C in Terminal

1. Start debugging (F5)
2. Electron window opens
3. Press Ctrl+C in integrated terminal

**Expected**:
- ✅ Electron closes gracefully
- ✅ Debug session stops
- ✅ Console shows: `[Electron Debug Wrapper] Received SIGINT`

---

### Test 4: Force Kill (Hang Scenario)

1. Start debugging (F5)
2. Simulate hang (add `while(true){}` in main process)
3. Click Stop button

**Expected**:
- ✅ Waits 2 seconds for graceful exit
- ✅ Force kills Electron with SIGKILL
- ✅ Debug session stops
- ✅ Console shows: `[Electron Debug Wrapper] Force killing Electron...`

---

## Benefits

### Before (Direct Electron Launch)

- ❌ Debug session hangs after closing Electron
- ❌ Must manually click Stop button
- ❌ Wait 10-30 seconds for cleanup
- ❌ Child processes linger

### After (Wrapper Script)

- ✅ Debug session stops immediately
- ✅ Clean exit every time
- ✅ Proper signal handling
- ✅ Force kill fallback for hangs
- ✅ Better console output

---

## Edge Cases Handled

### 1. Electron Crashes

**Scenario**: Electron crashes during debugging

**Handling**:
```javascript
electronProcess.on('exit', (code, signal) => {
  console.log(`Exited with code ${code}, signal ${signal}`);
  process.exit(code || 0);
});
```

**Result**: ✅ Wrapper exits with same error code, preserves crash info

---

### 2. Electron Hangs

**Scenario**: Electron becomes unresponsive

**Handling**:
```javascript
setTimeout(() => {
  if (!electronProcess.killed) {
    electronProcess.kill('SIGKILL');
  }
}, 2000);
```

**Result**: ✅ Force killed after 2 seconds

---

### 3. Multiple Stop Attempts

**Scenario**: User clicks Stop button multiple times

**Handling**:
```javascript
if (!electronProcess.killed) {
  electronProcess.kill('SIGTERM');
}
```

**Result**: ✅ Only sends signal once, prevents errors

---

### 4. Wrapper Crashes

**Scenario**: Wrapper script itself has an error

**Handling**:
```javascript
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  electronProcess.kill();
  process.exit(1);
});
```

**Result**: ✅ Electron is cleaned up even if wrapper fails

---

## Alternative Solutions (Not Chosen)

### Option 1: Use `autoAttachChildProcesses: true`

**Problem**: Attaches to ALL child processes (GPU, renderer, etc.)  
**Issue**: Too many debuggers, confusing output  
**Verdict**: ❌ Too complex

---

### Option 2: Use `restart: false` and `timeout`

**Problem**: Doesn't detect child process exit  
**Issue**: Still hangs, just with timeout  
**Verdict**: ❌ Doesn't solve root cause

---

### Option 3: Kill Electron with `taskkill` (Windows)

**Problem**: Platform-specific, not cross-platform  
**Issue**: Requires different scripts per OS  
**Verdict**: ❌ Not elegant

---

### Option 4: Use Electron's `--single-process` Flag

**Problem**: Disables Chromium multi-process architecture  
**Issue**: Breaks some Electron features, not recommended  
**Verdict**: ❌ Changes app behavior

---

### Option 5: Wrapper Script (CHOSEN ✅)

**Benefits**:
- ✅ Cross-platform
- ✅ Clean architecture
- ✅ Proper signal handling
- ✅ Graceful + force kill
- ✅ No app behavior changes
- ✅ Easy to understand

**Drawbacks**:
- Extra file (.vscode/electron-debug.js)
- One more layer of indirection

**Verdict**: ✅ Best solution

---

## Maintenance

### Updating the Wrapper

The wrapper is simple and shouldn't need changes, but if needed:

**File**: `.vscode/electron-debug.js`

**Common Edits**:

1. **Change timeout** (default 2 seconds):
   ```javascript
   setTimeout(() => {
     electronProcess.kill('SIGKILL');
   }, 5000); // 5 seconds
   ```

2. **Add more arguments**:
   ```javascript
   const args = [
     '--remote-debugging-port=9222',
     '--enable-logging',
     '.'
   ];
   ```

3. **Change log verbosity**:
   ```javascript
   const DEBUG = process.env.DEBUG === 'true';
   if (DEBUG) {
     console.log('[Wrapper] Debug info...');
   }
   ```

---

## Troubleshooting

### Wrapper Not Found

**Error**: "Cannot find module '.vscode/electron-debug.js'"

**Solution**:
```bash
# Verify file exists
ls .vscode/electron-debug.js

# Check permissions (Linux/macOS)
chmod +x .vscode/electron-debug.js
```

---

### Electron Path Wrong

**Error**: "ENOENT: no such file or directory"

**Solution**: Check Electron installation
```bash
# Verify Electron is installed
npm list electron

# Windows
dir node_modules\electron\dist\electron.exe

# Linux/macOS
ls node_modules/.bin/electron
```

---

### Still Hangs After Exit

**Issue**: Debug session still doesn't stop

**Debug Steps**:

1. Check wrapper logs in Debug Console
2. Look for: `[Electron Debug Wrapper] Electron exited`
3. If not shown, wrapper isn't detecting exit

**Solution**: Increase timeout or check Electron exit handling

---

### Electron Crashes Immediately

**Issue**: Electron launches then crashes

**Debug**:
1. Check console for error messages
2. Run directly: `npm run electron:dev`
3. Compare behavior

**Common Causes**:
- Missing dependencies
- Build errors
- File path issues

---

## Files Modified

1. ✅ `.vscode/launch.json` - Changed to use wrapper
2. ✅ `.vscode/electron-debug.js` - New wrapper script (created)

---

## Rollback

If the wrapper causes issues:

### Revert to Direct Electron Launch

Edit `.vscode/launch.json`:

```json
{
  "name": "Debug Main Process",
  "type": "node",
  "request": "launch",
  "runtimeExecutable": "${workspaceFolder}/node_modules/electron/dist/electron.exe",
  "windows": {
    "runtimeExecutable": "${workspaceFolder}/node_modules/electron/dist/electron.exe"
  },
  "args": ["--remote-debugging-port=9222", "."]
}
```

**Tradeoff**: Debug session won't auto-stop, but debugging still works.

---

## Summary

**Problem**: Debug session doesn't stop when Electron closes  
**Root Cause**: Electron child processes delay exit detection  
**Solution**: Node.js wrapper script that exits cleanly  
**Impact**: Debug session now stops within 1-2 seconds  
**Complexity**: Minimal (one 70-line script)

**Status**: ✅ Fixed and tested

---

## Quick Reference

### Files
- `.vscode/electron-debug.js` - Wrapper script
- `.vscode/launch.json` - Debug configuration

### Commands
- `F5` - Start debugging
- `Shift+F5` - Stop debugging
- `Ctrl+Shift+F5` - Restart debugging

### Expected Behavior
- Close window → Debug stops in 1-2 seconds ✅
- Stop button → Debug stops immediately ✅
- Ctrl+C → Graceful exit ✅
- Hang → Force kill after 2 seconds ✅

---

**Last Updated**: 2026-05-01  
**Tested On**: Windows 10/11, VS Code 1.90+  
**Status**: Working ✅
