# Windows Installer Build Guide

## Overview

CodePad uses Electron Builder with NSIS to create Windows installers (.exe).

## Prerequisites

- Node.js 18+ (currently using v22.11.0)
- npm
- Windows (for testing) or Wine (for Linux cross-compilation)

## Build Configuration

### Files

- **electron-builder-nosign.json** - Main build configuration (no code signing)
- **package.json** - Build scripts and metadata
- **assets/icon.ico** - Application icon (351KB, multi-resolution)
- **LICENSE** - MIT license (required for installer)

### NSIS Configuration

```json
{
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "CodePad",
    "perMachine": false,
    "installerIcon": "assets/icon.ico",
    "uninstallerIcon": "assets/icon.ico",
    "license": "LICENSE",
    "deleteAppDataOnUninstall": false
  }
}
```

**Key Settings:**

- `oneClick: false` - User sees installation wizard (not silent install)
- `allowToChangeInstallationDirectory: true` - User can choose install location
- `createDesktopShortcut: true` - Creates desktop shortcut
- `createStartMenuShortcut: true` - Adds to Start Menu
- `perMachine: false` - Installs per-user (no admin required)
- `deleteAppDataOnUninstall: false` - Preserves user data on uninstall

## Build Commands

### Full Production Build

```bash
npm run build:prod
```

This runs:
1. `npm run clean` - Removes `dist/` and `release/` directories
2. `npm run build` - Compiles TypeScript and bundles renderer
3. `npm run electron:build` - Creates installer

### Individual Steps

```bash
# Clean build artifacts
npm run clean

# Build main process (TypeScript)
npm run build:main

# Build renderer (Vite)
npm run build:renderer

# Create installer only (requires build first)
npm run electron:build
```

## Output

Installer is created in `release/` directory:

```
release/
├── CodePad-Setup-0.1.0.exe      # Windows installer (NSIS)
├── win-unpacked/                # Unpacked application files
├── builder-debug.yml            # Build debug info
└── builder-effective-config.yaml # Effective electron-builder config
```

**Installer name format:** `CodePad-Setup-{version}.exe`

## Installation Locations

**Per-user install (default):**
- Install directory: `C:\Users\{username}\AppData\Local\Programs\CodePad`
- Data directory: `C:\Users\{username}\AppData\Roaming\codepad`
- Shortcuts: Desktop + `C:\Users\{username}\AppData\Roaming\Microsoft\Windows\Start Menu\Programs`

**Per-machine install (if changed to `perMachine: true`):**
- Install directory: `C:\Program Files\CodePad`
- Data directory: `C:\Users\{username}\AppData\Roaming\codepad` (still per-user)
- Shortcuts: All Users Desktop + `C:\ProgramData\Microsoft\Windows\Start Menu\Programs`

## User Data

CodePad stores user data in:
```
C:\Users\{username}\AppData\Roaming\codepad\
├── codepad.db           # SQLite database with snippets
├── logs\                # Application logs
│   ├── main.log
│   └── renderer.log
└── settings.json        # User preferences (future)
```

**Important:** `deleteAppDataOnUninstall: false` means uninstalling preserves user data.

## Testing

### Test the Installer

1. **Build the installer:**
   ```bash
   npm run build:prod
   ```

2. **Run the installer:**
   ```bash
   cd release
   ./CodePad-Setup-0.1.0.exe
   ```

3. **Verify installation:**
   - Desktop shortcut created
   - Start Menu entry exists
   - Application launches from both shortcuts
   - Check: `C:\Users\{username}\AppData\Local\Programs\CodePad`

4. **Test the application:**
   - Create and run a snippet
   - Verify output displays correctly
   - Test file operations (save, load, delete)
   - Test settings (if implemented)

5. **Test uninstaller:**
   - Run: `C:\Users\{username}\AppData\Local\Programs\CodePad\Uninstall CodePad.exe`
   - Verify application removed
   - **Important:** Check user data still exists in AppData\Roaming\codepad

### Test Upgrade

1. Build new version with updated version number in `package.json`
2. Run new installer
3. Verify it detects existing installation
4. Verify upgrade completes successfully
5. Verify user data preserved

## Troubleshooting

### Issue: "Cannot find module @rollup/rollup-linux-x64-gnu"

**Problem:** npm has a bug with optional dependencies

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Installer won't run - SmartScreen warning"

**Problem:** Unsigned installer triggers Windows SmartScreen

**Solution:**
- For development: Click "More info" → "Run anyway"
- For distribution: Consider code signing certificate ($$$)

### Issue: "Application won't start after install"

**Check:**
1. .NET Runtime installed? (required for C# execution)
   - Download: https://dotnet.microsoft.com/download
2. Check logs: `%APPDATA%\codepad\logs\main.log`
3. Try running from command line to see errors

### Issue: "Build fails with ENOENT error"

**Problem:** Missing icon or LICENSE file

**Solution:**
- Verify `assets/icon.ico` exists
- Verify `LICENSE` file exists in root
- Check `electron-builder-nosign.json` paths

## Code Signing (Optional)

**Not currently implemented** - Installer is unsigned.

To add code signing:

1. Obtain a code signing certificate
2. Update `electron-builder-nosign.json`:
   ```json
   {
     "win": {
       "certificateFile": "path/to/certificate.pfx",
       "certificatePassword": "password",
       "forceCodeSigning": true
     }
   }
   ```

3. Rename config file to `electron-builder.json`

**Benefits:**
- No SmartScreen warning
- User trust
- Professional appearance

**Cost:** ~$100-300/year for certificate

## Distribution

### GitHub Releases

1. Create release tag:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

2. Upload installer:
   ```bash
   gh release create v0.1.0 \
     release/CodePad-Setup-0.1.0.exe \
     --title "CodePad v0.1.0" \
     --notes "Initial release"
   ```

### Direct Download

Host `CodePad-Setup-0.1.0.exe` on web server or GitHub Releases.

**Installation instructions:**
1. Download `CodePad-Setup-0.1.0.exe`
2. Run installer
3. Follow wizard prompts
4. Launch from Desktop shortcut or Start Menu

## Auto-Update (Future)

Electron Builder supports auto-update via:
- GitHub Releases
- Custom update server
- S3 bucket

**Not implemented in v0.1.0** - Add in future release.

## Related Files

- `package.json` - Build scripts and metadata
- `electron-builder-nosign.json` - NSIS configuration
- `assets/icon.ico` - Application icon
- `LICENSE` - MIT license text
- `scripts/upload-windows-build.sh` - Upload script (if exists)

## Version History

- **v0.1.0** (2026-05-05)
  - Initial Windows installer
  - NSIS with custom wizard
  - Per-user installation
  - Desktop + Start Menu shortcuts
  - Unsigned (no code signing)

---

**Last Updated:** 2026-05-05  
**Maintainer:** Trey Tomes  
**Issue:** #4
