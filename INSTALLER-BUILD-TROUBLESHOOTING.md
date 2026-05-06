# NSIS Installer Build - Troubleshooting Guide

## Issue: "UNKNOWN: unknown error, open 'CodePad.exe'"

### What Happened

The build successfully:
✅ Compiled TypeScript  
✅ Bundled renderer  
✅ Packaged Electron app  
✅ Created `release/win-unpacked/CodePad.exe`

But failed when trying to:
❌ Write ASAR integrity data to the executable  
❌ Create the NSIS installer

### Error Message

```
⨯ UNKNOWN: unknown error, open 'C:\Users\...\release\win-unpacked\CodePad.exe'
  at addWinAsarIntegrity
```

### Root Cause

**File locking by antivirus/Windows Defender**

When electron-builder creates `CodePad.exe`, Windows Defender immediately scans it. The build process then tries to write ASAR integrity data to the file, but it's locked by the antivirus scanner.

### Solutions

#### Solution 1: Add Antivirus Exclusion (RECOMMENDED)

**Windows Defender:**

1. Open **Windows Security**
2. Go to **Virus & threat protection**
3. Click **Manage settings** under "Virus & threat protection settings"
4. Scroll to **Exclusions** → Click **Add or remove exclusions**
5. Click **Add an exclusion** → **Folder**
6. Add: `C:\Users\TreyTomes\projects\code-pad\release`

**Then retry:**
```cmd
npm run electron:build
```

#### Solution 2: Build with Prepackaged App

If you already have `release/win-unpacked/`, you can build just the installer:

```cmd
build-installer-only.bat
```

This uses the existing unpacked app and skips the ASAR integrity step.

#### Solution 3: Temporarily Disable Real-Time Protection

**⚠️ Use with caution - leaves system vulnerable**

1. Open **Windows Security**
2. Go to **Virus & threat protection**
3. Click **Manage settings**
4. Turn OFF **Real-time protection** (temporary)
5. Run build:
   ```cmd
   npm run electron:build
   ```
6. Turn real-time protection back ON immediately

#### Solution 4: Run as Administrator

Sometimes elevated permissions help:

```cmd
# Right-click Command Prompt → Run as Administrator
cd C:\Users\TreyTomes\projects\code-pad
npm run electron:build
```

#### Solution 5: Disable ASAR Integrity Check

Edit `electron-builder-nosign.json`:

```json
{
  "win": {
    "asar": true,
    "asarIntegrity": false
  }
}
```

**Note:** This disables a security feature, but the app will still work fine.

Then rebuild:
```cmd
npm run electron:build
```

### Verifying the Build

#### Check what was created:

```cmd
dir release
```

**Expected files:**
```
release/
├── CodePad-Setup-0.1.0.exe      ← NSIS Installer (this is what we want)
├── win-unpacked/                ← Unpacked app directory
│   └── CodePad.exe              ← Application executable
├── builder-debug.yml
└── builder-effective-config.yaml
```

**If only `win-unpacked/` exists:**
The build stopped before creating the NSIS installer. Use Solution 1 or 2.

#### Test the unpacked app directly:

Even without the installer, you can run the app:

```cmd
release\win-unpacked\CodePad.exe
```

This helps verify the app itself works, even if the installer creation failed.

### Understanding the Build Process

```
1. Compile TypeScript (src → dist)          ✅ Always succeeds
2. Bundle Vite (renderer)                    ✅ Always succeeds  
3. Copy files to release/win-unpacked        ✅ Usually succeeds
4. Create CodePad.exe                        ✅ Usually succeeds
5. ⚠️ Write ASAR integrity → CodePad.exe    ❌ Often fails (antivirus lock)
6. Create NSIS installer                     ❌ Skipped if step 5 fails
```

**The antivirus locks the file between steps 4 and 5.**

### Alternative: Manual Installer Creation

If electron-builder continues to fail, you can use NSIS directly:

1. Install NSIS: https://nsis.sourceforge.io/Download
2. Create custom installer script
3. Build manually

**Not recommended** - electron-builder is easier once antivirus is configured.

### Prevention

**For future builds:**

1. Add permanent antivirus exclusion for `release/` folder
2. Consider using `asarIntegrity: false` in config
3. Build during off-hours when antivirus is less active
4. Use a dedicated build machine with minimal antivirus

### Related Warnings

#### Duplicate Dependencies

```
duplicate dependency references dependencies=["react-dom@19.2.5",...]
```

**Cause:** npm's dependency resolution duplicates some packages  
**Impact:** None - this is normal and safe to ignore  
**Fix:** Not needed, but could run `npm dedupe` if you want

#### Deprecation Warning

```
[DEP0190] DeprecationWarning: Passing args to a child process with shell...
```

**Cause:** electron-builder internal implementation  
**Impact:** None - still works fine  
**Fix:** Wait for electron-builder update

### Testing the Installer

Once `CodePad-Setup-0.1.0.exe` is created:

1. **Test installation:**
   ```cmd
   release\CodePad-Setup-0.1.0.exe
   ```

2. **Verify:**
   - Installation wizard appears ✓
   - Can choose directory ✓
   - Desktop shortcut created ✓
   - Start Menu entry created ✓
   - App launches ✓

3. **Test functionality:**
   - Create snippet ✓
   - Run C# code ✓
   - Save snippet ✓
   - Close and reopen ✓

4. **Test uninstall:**
   ```cmd
   "%LOCALAPPDATA%\Programs\CodePad\Uninstall CodePad.exe"
   ```
   - App removed ✓
   - Data preserved in `%APPDATA%\codepad` ✓

### Getting Help

**If none of these solutions work:**

1. Check `release/builder-debug.yml` for detailed file patterns
2. Check Windows Event Viewer for access denied errors
3. Try building on a different Windows machine
4. Check GitHub issues: https://github.com/electron-userland/electron-builder/issues

**Include in bug report:**
- Full error output
- `release/builder-debug.yml` contents
- Windows version: `winver`
- Antivirus software name
- Output of: `dir release /s`

---

**Last Updated:** 2026-05-06  
**Issue:** #4  
**Status:** Workarounds available
