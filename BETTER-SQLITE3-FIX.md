# Fixing better-sqlite3 C++20 Requirement on Windows

**Error**: `C++20 or later required`  
**Package**: better-sqlite3 v9.6.0  
**Platform**: Windows

---

## The Problem

better-sqlite3 v9.6.0 requires C++20 compiler support, but your Windows environment has an older Visual Studio Build Tools version that only supports C++17 or earlier.

**We chose v9.6.0 for WSL** (GCC 8.5 = C++17 max), but **Windows needs different handling**.

---

## Solution Options

### Option 1: Install Visual Studio Build Tools 2022 (Recommended)

This provides the C++20 compiler needed by better-sqlite3 v9.6.0+.

#### Via Chocolatey (Easiest)

```powershell
# Open PowerShell as Administrator
choco install visualstudio2022buildtools --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended --includeOptional"
```

#### Manual Download

1. Download Visual Studio Build Tools 2022:
   - https://visualstudio.microsoft.com/downloads/
   - Scroll to "Tools for Visual Studio 2022"
   - Download "Build Tools for Visual Studio 2022"

2. Run installer and select:
   - ✅ **Desktop development with C++**
   - ✅ **MSVC v143 - VS 2022 C++ x64/x86 build tools**
   - ✅ **Windows 10/11 SDK**

3. Install (takes ~10-15 minutes, ~7 GB)

4. Restart terminal and try again:
   ```batch
   npm install
   ```

**Pro**: Supports all modern npm packages  
**Con**: Large download (~7 GB), takes time

---

### Option 2: Use better-sqlite3 v11.x (Latest with Prebuilds)

The latest better-sqlite3 versions ship with prebuilt binaries for Windows, avoiding compilation entirely.

#### Update package.json

```json
{
  "dependencies": {
    "better-sqlite3": "^11.7.0"
  }
}
```

#### Install

```batch
npm install better-sqlite3@latest
```

**Pro**: No compilation needed, fastest solution  
**Con**: Requires Node.js 18.0.0+ (you have 22.11.0 ✅), different API might need code changes

---

### Option 3: Downgrade to better-sqlite3 v8.x

The v8 branch requires C++17 (supported by VS 2019).

#### Update package.json

```json
{
  "dependencies": {
    "better-sqlite3": "^8.7.0"
  }
}
```

#### Install

```batch
npm install better-sqlite3@8.7.0
```

**Pro**: Stable, well-tested, lower C++ requirements  
**Con**: Older version, missing some features

---

### Option 4: Skip SQLite for Phase 0 Week 2

Phase 0 Week 2 focuses on C# execution and doesn't actually need the database yet.

#### Temporarily Remove

```json
{
  "dependencies": {
    "better-sqlite3": "^9.6.0"  // Comment out or remove
  }
}
```

Then:
```batch
npm install
```

**Pro**: Fastest workaround, unblocks development  
**Con**: Need to address before Phase 1

---

## Recommended Approach

### For Immediate Development (Today)

**Use Option 4**: Remove better-sqlite3 temporarily

1. Edit `package.json`:
   ```json
   "dependencies": {
     // "better-sqlite3": "^9.6.0",  // Disabled until build tools ready
   ```

2. Install:
   ```batch
   npm install
   npm run build
   ```

3. You can now start Phase 0 Week 2 (C# execution) without SQLite

### For Long-Term (This Week)

**Use Option 2**: Upgrade to latest better-sqlite3 v11.x

1. Install VS Build Tools 2022 in background (or wait until needed)

2. Update to better-sqlite3 v11.x (has prebuilts):
   ```batch
   npm install better-sqlite3@latest
   ```

3. Works without compilation OR with C++20 support

---

## Implementation Guide

### Immediate Fix (5 minutes)

Create `package.json.no-sqlite`:

```json
{
  "name": "codepad",
  "version": "0.1.0",
  "dependencies": {
    "@monaco-editor/react": "^4.7.0",
    "antd": "^6.3.7",
    // "better-sqlite3": "^9.6.0",  // DISABLED - C++20 requirement
    "electron": "^30.0.0",
    "monaco-editor": "^0.55.1",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "uuid": "^14.0.0",
    "zustand": "^5.0.12"
  }
}
```

**Then**:
```batch
npm install
npm run build
npm run electron:dev
```

This should work! SQLite isn't needed until Phase 1 anyway.

---

### Long-Term Fix (Today or Tomorrow)

#### A. Install VS Build Tools 2022

**PowerShell (Administrator)**:
```powershell
# Option 1: Chocolatey (if installed)
choco install visualstudio2022buildtools --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools"

# Option 2: winget
winget install --id Microsoft.VisualStudio.2022.BuildTools

# Option 3: Manual
# Download from: https://visualstudio.microsoft.com/downloads/
# Install with "Desktop development with C++" workload
```

#### B. Update better-sqlite3

After VS Build Tools installed:

```json
{
  "dependencies": {
    "better-sqlite3": "^11.7.0"  // Latest with prebuilts
  }
}
```

```batch
npm install
```

---

## Version Comparison

| Version | C++ Required | Node.js | Prebuilts | Status |
|---------|--------------|---------|-----------|--------|
| v8.7.0 | C++17 | 14.21.0+ | ✅ Yes | Stable |
| v9.6.0 | C++20 | 16.0.0+ | ❌ No | What we have |
| v11.7.0 | C++20 | 18.0.0+ | ✅ Yes | Latest |

**Your Node.js**: v22.11.0 ✅ (supports all versions)

**Recommendation**: 
- Short-term: Remove SQLite (Option 4)
- Long-term: Upgrade to v11.7.0 (Option 2)

---

## Why This Happened

### The Version Mismatch

1. **WSL (AlmaLinux 8)**: Has GCC 8.5 → Max C++17
   - We chose better-sqlite3 v9.6.0 (oldest that still installs)
   - But even v9.6.0 requires C++20!

2. **Windows**: Needs MSVC with C++20 support
   - Visual Studio 2019 → C++17
   - Visual Studio 2022 → C++20 ✅

### The Real Solution

**Different versions for different platforms**:

- WSL: Use v8.7.0 (C++17) or skip compilation
- Windows: Use v11.7.0 (prebuilts) or install VS 2022

But for simplicity: **Just use v11.7.0 everywhere** (has prebuilts for all platforms).

---

## Testing the Fix

### After removing better-sqlite3

```batch
npm install
npm run build
npm run electron:dev
```

**Expected**: ✅ All succeed, Electron window opens

### After installing v11.7.0

```batch
npm install better-sqlite3@latest
npm run build
```

**Expected**: ✅ Installs prebuilt binary, no compilation

---

## Update Setup Scripts

### setup-python.bat

Add detection:

```batch
@echo off
REM Check if Visual Studio Build Tools are needed

REM Check if better-sqlite3 is in package.json
findstr /C:"better-sqlite3" package.json >nul 2>&1
if %errorlevel%==0 (
    echo [INFO] Project uses better-sqlite3
    echo.
    echo [WARNING] better-sqlite3 requires C++20 compiler
    echo.
    echo If npm install fails with "C++20 required", install:
    echo   Visual Studio Build Tools 2022
    echo   https://visualstudio.microsoft.com/downloads/
    echo.
    echo Or upgrade to better-sqlite3 v11.x (has prebuilts):
    echo   npm install better-sqlite3@latest
    echo.
)
```

---

## Modified Setup Script

Create `setup-dev-no-sqlite.bat`:

```batch
@echo off
REM Quick setup without SQLite dependency

echo ========================================
echo CodePad - Quick Setup (No SQLite)
echo ========================================
echo.

echo [INFO] This setup skips better-sqlite3 to avoid C++20 requirement
echo [INFO] Database features will be unavailable until you install VS Build Tools 2022
echo.

REM Backup original package.json
copy /Y package.json package.json.backup >nul

REM Remove better-sqlite3 line
powershell -Command "(Get-Content package.json) -replace '.*better-sqlite3.*', '    // better-sqlite3 disabled' | Set-Content package.json"

echo [INFO] Installing dependencies...
call npm install

if errorlevel 1 (
    echo [ERROR] npm install failed
    copy /Y package.json.backup package.json >nul
    del package.json.backup >nul
    pause
    exit /b 1
)

echo [INFO] Building...
call npm run build

if errorlevel 1 (
    echo [ERROR] Build failed
    copy /Y package.json.backup package.json >nul
    del package.json.backup >nul
    pause
    exit /b 1
)

REM Restore original package.json
copy /Y package.json.backup package.json >nul
del package.json.backup >nul

echo.
echo [SUCCESS] Setup complete (SQLite disabled)
echo.
echo To run: npm run electron:dev
echo.
pause
```

---

## Recommended Action Plan

### Right Now (Unblock Development)

```batch
# 1. Comment out better-sqlite3 in package.json
# Open package.json, find this line:
#   "better-sqlite3": "^9.6.0",
# Change to:
#   // "better-sqlite3": "^9.6.0",

# 2. Install without SQLite
npm install

# 3. Build
npm run build

# 4. Test
npm run electron:dev
```

### This Afternoon (Install Build Tools)

```powershell
# Open PowerShell as Administrator
choco install visualstudio2022buildtools --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools"

# Or download manually:
# https://visualstudio.microsoft.com/downloads/
```

### Tomorrow (Add SQLite Back)

```batch
# Uncomment better-sqlite3 in package.json
# Or upgrade to latest:
npm install better-sqlite3@latest

# Rebuild
npm install
npm run build
```

---

## Summary

**Problem**: better-sqlite3 v9.6.0 requires C++20, but your Windows doesn't have it

**Immediate Fix**: Remove better-sqlite3 temporarily (5 minutes)
- Edit package.json
- Comment out the line
- npm install
- npm run build

**Proper Fix**: Install Visual Studio Build Tools 2022 (15 minutes)
- Provides C++20 support
- Enables all native modules

**Best Fix**: Upgrade to better-sqlite3 v11.7.0 (uses prebuilts)
- No compilation needed
- Works with any VS version
- Fastest installs

**Recommendation**: 
1. Today: Comment out better-sqlite3, continue development
2. Later: Install VS Build Tools 2022 in background
3. This week: Upgrade to better-sqlite3 v11.7.0

---

**Status**: Solution provided, ready to implement  
**Estimated Time**: 5 minutes (temporary fix) or 15 minutes (proper fix)  
**Next Action**: Comment out better-sqlite3 in package.json and retry npm install
