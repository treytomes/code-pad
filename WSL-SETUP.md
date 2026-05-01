# WSL Development Setup for CodePad

## Environment Overview

This project is being developed on:
- **Host OS**: Windows 10 (City Electric Supply corporate laptop)
- **WSL2**: AlmaLinux 8.10 (Cerulean Leopard)
- **Kernel**: 6.6.87.2-microsoft-standard-WSL2

## Known Limitations

### Electron GUI Cannot Run in WSL2

**Issue**: Electron requires a display server (X11 or Wayland) to render GUI windows. WSL2 does not have a display server by default.

**Error**:
```
electron: error while loading shared libraries: libatk-bridge-2.0.so.0: cannot open shared object file
```

**Why**: Even with WSLg (Windows Subsystem for Linux GUI support), AlmaLinux 8 may be missing required GTK/ATK accessibility libraries.

## Development Workflow Options

### Option 1: Test Build Only (Current)

Verify the project builds without running the GUI:

```bash
npm run build    # Verify TypeScript compiles and Vite builds successfully
```

**Use for**:
- Backend logic development
- Build system testing
- CI/CD pipeline development
- Unit/integration tests (non-GUI)

### Option 2: Install WSLg + Dependencies

If your Windows 10 build supports WSLg, install missing libraries:

```bash
# Check if WSLg is available
echo $DISPLAY  # Should show :0 or similar

# Install GTK3 and accessibility libraries (requires sudo)
sudo yum install -y \
  gtk3 \
  libXScrnSaver \
  libXtst \
  nss \
  at-spi2-atk \
  cups-libs \
  libdrm \
  mesa-libgbm \
  alsa-lib
```

Then try:
```bash
npm run electron:dev
```

**Limitations**: May require IT approval for system package installation.

### Option 3: X11 Forwarding (VcXsrv/Xming)

Use an X11 server on Windows to display Linux GUI apps:

1. **Install X11 server on Windows**:
   - VcXsrv: https://sourceforge.net/projects/vcxsrv/
   - Or Xming: https://sourceforge.net/projects/xming/

2. **Start X11 server** with:
   - Display number: 0
   - Disable access control

3. **Configure WSL**:
   ```bash
   export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):0
   export LIBGL_ALWAYS_INDIRECT=1
   ```

4. **Add to ~/.bashrc** for persistence:
   ```bash
   echo 'export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk "{print \$2}"):0' >> ~/.bashrc
   echo 'export LIBGL_ALWAYS_INDIRECT=1' >> ~/.bashrc
   ```

5. **Install dependencies** (same as Option 2)

6. **Run Electron**:
   ```bash
   npm run electron:dev
   ```

**Limitations**: Performance may be slower than native.

### Option 4: VS Code Remote - SSH (Recommended for Development)

Use VS Code on Windows to connect to WSL and develop there, but run builds only:

1. **Install VS Code on Windows**
2. **Install "Remote - WSL" extension**
3. **Open project from WSL**:
   ```
   code .
   ```
   (This opens VS Code on Windows, connected to WSL filesystem)

4. **Develop in VS Code (Windows)**
   - Full IntelliSense and debugging
   - Terminal runs in WSL

5. **Build/test in WSL terminal**:
   ```bash
   npm run build        # Build only
   npm run test         # Unit tests (no GUI)
   ```

6. **Test GUI on Windows** (future):
   - Build Windows installer: `npm run electron:build`
   - Copy to Windows filesystem: `/mnt/c/temp/`
   - Run installer on Windows host

### Option 5: Develop on Windows Natively (Recommended for Electron)

**Best for Electron GUI development**:

1. **Clone project to Windows**:
   ```powershell
   cd C:\Users\TreyTomes\projects
   git clone <repository-url>
   cd code-pad
   ```

2. **Install Node.js on Windows** (use nvm-windows or direct install)

3. **Install dependencies**:
   ```powershell
   npm install
   ```

4. **Run Electron**:
   ```powershell
   npm run electron:dev
   ```

**Benefits**:
- Full GUI testing
- Better Electron debugging
- No display server issues

**Sync with WSL**:
- Use Git to sync changes between Windows and WSL
- Or access Windows files from WSL: `/mnt/c/Users/TreyTomes/projects/code-pad`

## Current Development Strategy

For Phase 0 (Foundation):
- ✅ **WSL**: Build system, backend logic, TypeScript, database
- ✅ **Build verification**: Ensure project compiles
- ⏳ **GUI testing**: Deferred or done on Windows

For Phase 1 (Core MVP):
- **Consider**: Switch to Windows native development for UI work
- **Or**: Use VS Code Remote-WSL + periodic Windows testing

## VS Code Node.js Path Issue - FIXED

**Issue**: VS Code couldn't find Node.js binary from nvm

**Fix Applied**:
1. Updated `.vscode/settings.json`:
   - Added Node.js path to terminal environment
   - Configured nvm integration for bash terminal

2. Updated `.vscode/launch.json`:
   - Set explicit `runtimeExecutable` for Node.js: `${env:HOME}/.nvm/versions/node/v22.11.0/bin/node`
   - Set explicit `runtimeExecutable` for npm: `${env:HOME}/.nvm/versions/node/v22.11.0/bin/npm`
   - Added NODE_ENV to debug configuration

**Reload VS Code** after these changes:
```
Ctrl+Shift+P → "Developer: Reload Window"
```

## Testing Without GUI

While GUI is unavailable, you can still test:

### 1. Build Verification
```bash
npm run build
# Should complete without errors
```

### 2. TypeScript Compilation
```bash
npx tsc --noEmit
# Should show no type errors
```

### 3. Linting
```bash
npm run lint
# Should show no lint errors
```

### 4. Unit Tests (Once Created)
```bash
npm test
# Tests that don't require DOM/GUI
```

### 5. Backend Logic
```bash
# Test C# execution engine
node -e "const { spawn } = require('child_process'); spawn('dotnet', ['--version']).stdout.pipe(process.stdout);"
```

## Recommended Next Steps

1. **For now**: Continue development in WSL, focus on non-GUI components:
   - ✅ Build system (done)
   - ⏳ C# execution engine (Week 2)
   - ⏳ Database layer (Week 2)
   - ⏳ Backend logic

2. **When UI work begins** (Phase 1, Week 3+):
   - Option A: Switch to Windows native development
   - Option B: Set up X11 forwarding
   - Option C: Develop in WSL, test on Windows periodically

3. **CI/CD**: Build on Linux (GitHub Actions) will work fine for automated testing

## Resources

- [WSLg Documentation](https://github.com/microsoft/wslg)
- [Electron in WSL](https://www.electronjs.org/docs/latest/development/build-instructions-linux#prerequisites)
- [VS Code Remote - WSL](https://code.visualstudio.com/docs/remote/wsl)
- [X11 Forwarding Guide](https://stackoverflow.com/questions/61110603/how-to-set-up-working-x11-forwarding-on-wsl2)

## Summary

✅ **Build works**: Project compiles successfully  
❌ **GUI doesn't work**: Electron can't display windows in WSL2 without setup  
✅ **VS Code fixed**: Node.js path issues resolved  
🎯 **Next**: Test on Windows or continue with non-GUI development  

The project is healthy and building correctly. The GUI limitation is an environment issue, not a project issue.
