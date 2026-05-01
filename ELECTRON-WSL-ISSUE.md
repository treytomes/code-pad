# Electron Module Loading Issue in WSL

## Problem Summary

Electron is installed and the binary runs, but the `electron` module does not provide its exports when loaded via `require('electron')` or `import from 'electron'`, even when running from within the Electron process.

## Symptoms

```javascript
const { app, BrowserWindow } = require('electron');
console.log(app); // undefined
console.log(BrowserWindow); // undefined
```

**Error when trying to use**:
```
TypeError: Cannot read properties of undefined (reading 'whenReady')
```

## Environment

- **OS**: AlmaLinux 8.10 (WSL2)
- **Kernel**: 6.6.87.2-microsoft-standard-WSL2
- **Node.js**: v22.11.0 (via nvm)
- **Electron**: Tested with 30.0.0 and 41.4.0
- **WSLg**: Available (DISPLAY=:0, WAYLAND_DISPLAY=wayland-0)
- **GTK Libraries**: Installed via setup-wslg.sh

## What Works

✅ Electron binary exists and executes  
✅ WSLg is configured  
✅ GTK dependencies are installed  
✅ Project builds successfully (TypeScript, Vite)  
✅ Node.js and npm work correctly  
✅ `require('electron')` from plain Node.js returns path string (expected)

## What Doesn't Work

❌ `require('electron')` from within Electron process returns string, not API object  
❌ Both CommonJS and ESM imports fail  
❌ Both Electron 30 and 41 have the same issue  
❌ Fresh reinstalls don't help  

## Tests Performed

### Test 1: Basic CommonJS
```javascript
// test-electron.js
const { app, BrowserWindow } = require('electron');
app.whenReady().then(() => { /* ... */ });
```

**Result**: `app` is `undefined`

### Test 2: ESM Import
```javascript
// test-electron.mjs  
import { app, BrowserWindow } from 'electron';
```

**Result**: `SyntaxError: The requested module 'electron' does not provide an export named 'BrowserWindow'`

### Test 3: Namespace Import
```javascript
const electron = require('electron');
console.log(typeof electron); // "string"
console.log(electron); // "/path/to/electron/binary"
```

**Result**: electron is a string path, not an object with exports

## Root Cause Analysis

When `require('electron')` is called from regular Node.js, it correctly returns the path to the Electron binary (this is by design - the electron npm package's main export points to the binary path).

However, when code is run **inside** Electron (via `electron .` or `electron script.js`), Electron is supposed to intercept `require('electron')` calls and provide the Electron APIs instead of the path string.

**This interception is not happening in our WSL environment.**

## Possible Causes

1. **WSL/AlmaLinux Incompatibility**: Electron's module interception may not work in WSL2 + AlmaLinux 8
2. **Electron Binary Issue**: The downloaded binary may not be complete or compatible
3. **Node.js Version Mismatch**: Node 22.11.0 via nvm might have compatibility issues
4. **Missing System Dependencies**: Some library Electron needs for module loading may be missing

## Verification Steps Taken

- ✅ Verified Electron binary exists: `node_modules/electron/dist/electron`
- ✅ Verified version file: `30.0.0` (or `41.4.0`)
- ✅ Stack traces show Electron is loading: `node:electron/js2c/node_init`
- ✅ Tested with both Electron 30 and 41
- ✅ Tested with fresh `npm install`
- ✅ Tested with `npm install --force`
- ✅ Removed and reinstalled electron completely

## Workarounds Attempted

None successful yet.

## Next Steps to Try

### Option 1: Test on Windows Native
Since the corporate laptop runs Windows 10, test if Electron works natively on Windows:

```powershell
cd C:\Users\TreyTomes\projects\code-pad
npm install
npm run build
npm run electron:dev
```

**Expected**: Should work fine on Windows.

### Option 2: Test with Older Node.js
The issue might be Node.js 22.11.0 specific:

```bash
nvm install 20.11.0
nvm use 20.11.0
npm install
npm run electron:dev
```

### Option 3: Test with Prebuilt Binaries
Try forcing electron to download prebuilt binaries:

```bash
npm install electron@30.0.0 --force --ignore-scripts=false
```

### Option 4: Use Electron Forge
Use Electron Forge which handles builds differently:

```bash
npm install --save-dev @electron-forge/cli
npx electron-forge import
npm start
```

### Option 5: Docker Container
Run Electron in a Docker container with full desktop environment:

```bash
docker run -it --rm \
  -e DISPLAY=$DISPLAY \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  -v $(pwd):/app \
  electronuserland/builder:wine \
  /bin/bash
```

### Option 6: Research Known Issues
Search for:
- "Electron WSL2 require undefined"
- "Electron AlmaLinux module loading"
- "Electron require returns string"
- GitHub Issues in electron/electron repository

## Recommendations

**For Immediate Progress** (Phase 0 completion):
1. Continue with build system development (already works)
2. Develop backend C# execution engine (doesn't need GUI)
3. Create database layer (SQLite already works)
4. Write unit tests for non-GUI components

**For GUI Development** (Phase 1):
1. **Primary**: Develop on Windows natively
   - Clone project to `C:\Users\TreyTomes\projects\code-pad`
   - Use Windows Terminal with PowerShell
   - Full Electron support guaranteed
   
2. **Alternative**: Use VS Code Remote-WSL for editing, test builds on Windows
   - Edit in WSL (better performance)
   - Build in WSL (faster)
   - Test GUI on Windows periodically

3. **Future**: Investigate if newer WSL2/Electron versions fix this

## Status

🔴 **BLOCKED**: Cannot run Electron GUI in current WSL environment  
🟢 **WORKING**: Build system, backend development, database  
🟡 **WORKAROUND AVAILABLE**: Develop on Windows host  

## References

- [Electron in WSL](https://www.electronjs.org/docs/latest/development/build-instructions-linux)
- [WSLg Documentation](https://github.com/microsoft/wslg)
- [Electron Module Resolution](https://www.electronjs.org/docs/latest/tutorial/electron-module-resolution)

---

**Last Updated**: 2026-05-01  
**Issue Status**: Unresolved - Investigating
