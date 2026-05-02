# Upload Guide - CodePad v0.1.0 Release

This guide explains how to upload builds to the GitHub release for CodePad v0.1.0.

## Quick Start

### Step 1: Create the GitHub Release

**From Linux/WSL/macOS**:
```bash
./scripts/create-release.sh
```

This will:
- Check that the v0.1.0 tag exists
- Create a GitHub pre-release
- Use RELEASE_NOTES_v0.1.0.md as the release description

### Step 2: Upload Platform Builds

Upload builds as they become available:

#### Linux (WSL/Ubuntu/Fedora)
```bash
./scripts/upload-linux-build.sh
```

Uploads:
- `release/CodePad-0.1.0.AppImage` (required)
- `release/CodePad_0.1.0_amd64.deb` (optional, if available)

#### Windows (PowerShell/Git Bash/WSL)
```bash
# Git Bash or WSL
bash scripts/upload-windows-build.sh

# Windows Command Prompt
scripts\upload-windows-build.bat
```

Uploads:
- `release/CodePad-Setup-0.1.0.exe`

#### macOS
```bash
./scripts/upload-macos-build.sh
```

Uploads:
- `release/CodePad-0.1.0.dmg`

---

## Detailed Instructions

### Prerequisites

1. **GitHub CLI (gh) installed**:
   ```bash
   # Check if installed
   gh --version
   
   # Install if needed:
   # Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md
   # Windows: winget install GitHub.cli
   # macOS: brew install gh
   ```

2. **GitHub authentication**:
   ```bash
   gh auth status
   
   # If not authenticated:
   gh auth login
   ```

3. **Repository access**:
   - Must have write access to `treytomes/code-pad` repository

---

## Current Build Status

### ✅ Available Builds

| Platform | File | Size | Status |
|----------|------|------|--------|
| Linux AppImage | `release/CodePad-0.1.0.AppImage` | 137 MB | ✅ Built |

### ⏳ Pending Builds

| Platform | File | Size | Status |
|----------|------|------|--------|
| Windows | `release/CodePad-Setup-0.1.0.exe` | ~150 MB | ⏳ Needs Windows build |
| macOS | `release/CodePad-0.1.0.dmg` | ~150 MB | ⏳ Needs macOS build |
| Linux .deb | `release/CodePad_0.1.0_amd64.deb` | ~140 MB | ⏳ Optional (needs author email fix) |

---

## Building Missing Packages

### Windows Installer

**On Windows machine**:
```powershell
# Navigate to project
cd C:\path\to\code-pad

# Install dependencies (if not already done)
npm install

# Build code
npm run build

# Build Windows installer
npx electron-builder --windows nsis

# Verify output
dir release\CodePad-Setup-0.1.0.exe
```

### macOS DMG

**On macOS machine**:
```bash
# Navigate to project
cd /path/to/code-pad

# Install dependencies (if not already done)
npm install

# Build code
npm run build

# Build macOS DMG
npx electron-builder --mac dmg

# Verify output
ls -lh release/CodePad-0.1.0.dmg
```

### Linux .deb (Optional)

**On Linux/WSL**:
```bash
# Fix author email requirement
npm pkg set "author.email=codepad@example.com"

# Rebuild .deb
npx electron-builder --linux deb

# Verify output
ls -lh release/CodePad_0.1.0_amd64.deb
```

---

## Upload Workflow Examples

### Scenario 1: Linux-Only Pre-Release

You only have the Linux AppImage built:

```bash
# 1. Create release
./scripts/create-release.sh

# 2. Upload Linux AppImage
./scripts/upload-linux-build.sh

# 3. Edit release notes to mention other platforms coming soon
gh release edit v0.1.0 --notes "...Linux-only initially, Windows and macOS coming soon..."
```

### Scenario 2: Full Multi-Platform Release

You have all platform builds ready:

```bash
# 1. Create release
./scripts/create-release.sh

# 2. Upload Linux build
./scripts/upload-linux-build.sh

# 3. On Windows machine:
bash scripts/upload-windows-build.sh

# 4. On macOS machine:
./scripts/upload-macos-build.sh

# 5. Mark as ready (remove pre-release flag)
gh release edit v0.1.0 --prerelease=false
```

### Scenario 3: Add Builds Later

Release is already created, adding more builds:

```bash
# Just run the upload script for the platform
# Scripts automatically use --clobber to replace if file exists

# Example: Adding Windows build later
bash scripts/upload-windows-build.sh
```

---

## Manual Upload Commands

If you prefer to upload manually without scripts:

### Create Release
```bash
gh release create v0.1.0 \
  --repo treytomes/code-pad \
  --title "CodePad v0.1.0 - Pre-Release" \
  --notes-file RELEASE_NOTES_v0.1.0.md \
  --prerelease
```

### Upload Files
```bash
# Linux AppImage
gh release upload v0.1.0 release/CodePad-0.1.0.AppImage \
  --repo treytomes/code-pad \
  --clobber

# Windows installer
gh release upload v0.1.0 release/CodePad-Setup-0.1.0.exe \
  --repo treytomes/code-pad \
  --clobber

# macOS DMG
gh release upload v0.1.0 release/CodePad-0.1.0.dmg \
  --repo treytomes/code-pad \
  --clobber
```

---

## Troubleshooting

### "release not found"

**Cause**: Release hasn't been created yet

**Fix**:
```bash
./scripts/create-release.sh
```

### "File not found: release/CodePad-..."

**Cause**: Build hasn't been created yet

**Fix**: Build the package first:
```bash
# For Linux
npm run build
npx electron-builder --linux AppImage deb

# For Windows (on Windows)
npm run build
npx electron-builder --windows nsis

# For macOS (on macOS)
npm run build
npx electron-builder --mac dmg
```

### "gh: command not found"

**Cause**: GitHub CLI not installed

**Fix**:
- **Linux**: Follow https://github.com/cli/cli/blob/trunk/docs/install_linux.md
- **Windows**: `winget install GitHub.cli`
- **macOS**: `brew install gh`

### "HTTP 401: Unauthorized"

**Cause**: Not authenticated with GitHub

**Fix**:
```bash
gh auth login
```

### "HTTP 403: Forbidden"

**Cause**: No write access to repository

**Fix**: Ensure you have collaborator access to `treytomes/code-pad`

### Upload Hangs or Fails

**Cause**: Large file upload interrupted

**Fix**: The scripts use `--clobber` flag, so just run the script again:
```bash
./scripts/upload-linux-build.sh
```

---

## Verification

After uploading, verify the release:

### Check Release Assets
```bash
gh release view v0.1.0 --repo treytomes/code-pad
```

Expected output should show:
```
TITLE
  CodePad v0.1.0 - Pre-Release

ASSETS
  CodePad-0.1.0.AppImage              Linux AppImage
  CodePad-Setup-0.1.0.exe             Windows Installer
  CodePad-0.1.0.dmg                   macOS DMG
```

### View in Browser
```bash
gh release view v0.1.0 --repo treytomes/code-pad --web
```

### Test Downloads
```bash
# Download and test (from another machine)
wget https://github.com/treytomes/code-pad/releases/download/v0.1.0/CodePad-0.1.0.AppImage
chmod +x CodePad-0.1.0.AppImage
./CodePad-0.1.0.AppImage
```

---

## Post-Upload Tasks

After all builds are uploaded:

1. **Test each installer** on a clean system
2. **Update README.md** with download links
3. **Close Issue #4** with release URL
4. **Update project board** (move to Done)
5. **Announce release** (optional)

---

## Quick Reference

### All Upload Scripts

```bash
# Create release
./scripts/create-release.sh

# Upload Linux
./scripts/upload-linux-build.sh

# Upload Windows (Git Bash/WSL)
bash scripts/upload-windows-build.sh

# Upload Windows (Windows cmd)
scripts\upload-windows-build.bat

# Upload macOS
./scripts/upload-macos-build.sh
```

### View Release
```bash
gh release view v0.1.0 --repo treytomes/code-pad
gh release view v0.1.0 --repo treytomes/code-pad --web
```

### Edit Release
```bash
# Change notes
gh release edit v0.1.0 --notes "Updated release notes"

# Remove pre-release flag
gh release edit v0.1.0 --prerelease=false

# Make it a draft
gh release edit v0.1.0 --draft
```

### Delete Release (if needed)
```bash
gh release delete v0.1.0 --repo treytomes/code-pad --yes
```

---

## Support

If you encounter issues:
- **GitHub Docs**: https://cli.github.com/manual/gh_release
- **Project Issues**: https://github.com/treytomes/code-pad/issues
- **Release Guide**: `docs/RELEASE_GUIDE.md`

---

**Created**: 2026-05-02  
**Version**: 1.0  
**Maintainer**: CodePad Team
