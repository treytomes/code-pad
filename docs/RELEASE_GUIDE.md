# Release Guide - CodePad v0.1.0

This document describes the complete process for creating and publishing a production release of CodePad.

## Prerequisites

### Required Software
- **.NET SDK 8.0+** (for testing)
- **Node.js 22.11.0+** (via nvm)
- **Git** with GitHub CLI (gh)
- **Platform-specific builders**:
  - Windows: NSIS (automatically downloaded by electron-builder)
  - macOS: No additional requirements (needs macOS to build)
  - Linux: Standard build tools (gcc, make)

### Repository State
- [ ] All code committed and pushed
- [ ] All CI checks passing (ESLint, TypeScript, Prettier)
- [ ] All tests passing locally
- [ ] Version number correct in `package.json`
- [ ] CHANGELOG.md updated
- [ ] RELEASE_NOTES_v0.1.0.md ready

## Building Platform Packages

### 1. Linux Packages (Ubuntu/Debian)

**Platforms**: AppImage (portable), .deb (Debian/Ubuntu)

```bash
# Build code
npm run build

# Build packages
npx electron-builder --linux AppImage deb

# Output location
ls -lh release/
# Expected:
# - CodePad-0.1.0.AppImage
# - CodePad_0.1.0_amd64.deb
```

**Testing**:
```bash
# AppImage
chmod +x release/CodePad-0.1.0.AppImage
./release/CodePad-0.1.0.AppImage

# .deb
sudo dpkg -i release/CodePad_0.1.0_amd64.deb
codepad
```

---

### 2. Windows Installer

**Platform**: Windows 10+  
**Format**: NSIS installer (.exe)

**Requirements**:
- Must be built on Windows (or Windows VM)
- NSIS automatically downloaded by electron-builder

```powershell
# On Windows machine
cd C:\path\to\code-pad

# Build code
npm run build

# Build installer
npx electron-builder --windows nsis

# Output location
dir release\
# Expected:
# - CodePad-Setup-0.1.0.exe
```

**Testing**:
```powershell
# Run installer
.\release\CodePad-Setup-0.1.0.exe

# Install to default location
# Test app launches
# Test all features
# Uninstall via Control Panel
```

---

### 3. macOS Package

**Platform**: macOS 10.15+  
**Format**: DMG disk image

**Requirements**:
- Must be built on macOS
- Xcode Command Line Tools installed
- Optional: Apple Developer certificate for code signing

```bash
# On macOS machine
cd /path/to/code-pad

# Build code
npm run build

# Build DMG
npx electron-builder --mac dmg

# Output location
ls -lh release/
# Expected:
# - CodePad-0.1.0.dmg
```

**Testing**:
```bash
# Open DMG
open release/CodePad-0.1.0.dmg

# Drag CodePad.app to Applications
# Launch from Applications
# Test all features
# Eject DMG
```

---

## Release Workflow

### Phase 1: Pre-Release Checks

```bash
# 1. Ensure clean working directory
git status
# Should show: "nothing to commit, working tree clean"

# 2. Verify version
cat package.json | grep version
# Should show: "version": "0.1.0"

# 3. Run full test suite
npm run test:all

# 4. Verify CI passing
gh run list --limit 1
# Should show: "completed  success"

# 5. Check all icons generated
ls -lh assets/icon.*
# Should show: icon.ico, icon.icns, icon.png, icon.svg
```

---

### Phase 2: Build Packages

**Option A: Multi-Platform (Recommended)**

Use separate machines or CI/CD:

1. **Linux** (WSL, Ubuntu VM, or GitHub Actions):
   ```bash
   npm run build
   npx electron-builder --linux AppImage deb
   ```

2. **Windows** (Windows machine or GitHub Actions):
   ```powershell
   npm run build
   npx electron-builder --windows nsis
   ```

3. **macOS** (Mac machine or GitHub Actions):
   ```bash
   npm run build
   npx electron-builder --mac dmg
   ```

**Option B: Single Platform** (Current - WSL Linux only)

Build Linux packages only for initial pre-release:
```bash
npm run build:prod  # Builds code + Linux packages
```

---

### Phase 3: Test Installers

For each platform package:

**Installation Test**:
- [ ] Installer runs without errors
- [ ] Application installs to expected location
- [ ] Desktop/Start Menu shortcuts created
- [ ] Application launches successfully

**Functional Test**:
- [ ] Runtime check detects .NET SDK
- [ ] Code execution works (run sample: Hello World)
- [ ] Create and save new snippet
- [ ] Load existing snippet
- [ ] Star/unstar snippet
- [ ] Search snippets
- [ ] Import/Export functionality
- [ ] Settings persist across restarts
- [ ] Window position/size persists
- [ ] All samples load correctly
- [ ] Keyboard shortcuts work (F5, Ctrl+S, Ctrl+N, etc.)
- [ ] About dialog shows correct version

**Uninstall Test** (Windows only):
- [ ] Uninstaller runs cleanly
- [ ] All files removed (except user data)
- [ ] Start Menu shortcuts removed

---

### Phase 4: Create Git Tag

```bash
# Tag the release
git tag -a v0.1.0 -m "Release v0.1.0 - Pre-Release

First public pre-release of CodePad featuring:
- C# code execution with LINQPad-style .Dump()
- Snippet management (CRUD, star, search, import/export)
- 12 built-in sample examples
- Monaco Editor with IntelliSense
- Settings and window state persistence

System Requirements:
- .NET SDK 8.0+
- Windows 10+ / macOS 10.15+ / Modern Linux

Known Limitations:
- C# only (multi-language coming in Phase 2)
- No NuGet package support yet
- Dark theme only

See RELEASE_NOTES_v0.1.0.md for full details.
"

# Push tag to GitHub
git push origin v0.1.0
```

---

### Phase 5: Create GitHub Release

```bash
# Create release with assets
gh release create v0.1.0 \
  --title "CodePad v0.1.0 - Pre-Release" \
  --notes-file RELEASE_NOTES_v0.1.0.md \
  --prerelease \
  release/CodePad-Setup-0.1.0.exe#"Windows Installer (64-bit)" \
  release/CodePad-0.1.0.dmg#"macOS DMG Package (10.15+)" \
  release/CodePad-0.1.0.AppImage#"Linux AppImage (Portable)" \
  release/CodePad_0.1.0_amd64.deb#"Linux .deb Package (Debian/Ubuntu)"

# Or create release manually and upload files via web UI
```

**Note**: Use `--prerelease` flag for v0.1.0 as this is a pre-release version.

---

### Phase 6: Update Documentation

**1. Update README.md** with download links:

```markdown
## Download

Download the latest release:

- **Windows**: [CodePad-Setup-0.1.0.exe](https://github.com/treytomes/code-pad/releases/download/v0.1.0/CodePad-Setup-0.1.0.exe)
- **macOS**: [CodePad-0.1.0.dmg](https://github.com/treytomes/code-pad/releases/download/v0.1.0/CodePad-0.1.0.dmg)
- **Linux**: 
  - [CodePad-0.1.0.AppImage](https://github.com/treytomes/code-pad/releases/download/v0.1.0/CodePad-0.1.0.AppImage) (Portable)
  - [CodePad_0.1.0_amd64.deb](https://github.com/treytomes/code-pad/releases/download/v0.1.0/CodePad_0.1.0_amd64.deb) (Debian/Ubuntu)

**System Requirements**: .NET SDK 8.0+ ([Download](https://dotnet.microsoft.com/download))
```

**2. Create Wiki Pages**:

- **Installation-Windows.md**:
  ```markdown
  # Installing CodePad on Windows
  
  ## Prerequisites
  - Windows 10 or later
  - .NET SDK 8.0+ ([Download](https://dotnet.microsoft.com/download))
  
  ## Installation Steps
  1. Download [CodePad-Setup-0.1.0.exe](https://github.com/treytomes/code-pad/releases/download/v0.1.0/CodePad-Setup-0.1.0.exe)
  2. Run the installer
  3. Follow the installation wizard
  4. Launch CodePad from Start Menu
  
  ## Troubleshooting
  - If ".NET SDK not found" warning appears, install .NET SDK 8.0+
  - If Windows Defender blocks, click "More info" → "Run anyway"
  ```

- **Installation-macOS.md**
- **Installation-Linux.md**

---

### Phase 7: Close Issues & Update Project Board

```bash
# Close Issue #4
gh issue close 4 --comment "Production packages built and released in v0.1.0.

Downloads:
- Windows: CodePad-Setup-0.1.0.exe
- macOS: CodePad-0.1.0.dmg
- Linux: CodePad-0.1.0.AppImage, CodePad_0.1.0_amd64.deb

Release: https://github.com/treytomes/code-pad/releases/tag/v0.1.0"

# Check milestone status
gh issue list --milestone "v0.1.0 - Pre-Release"
# Should show no open issues

# Move project board items to Done
# (done manually via web UI)
```

---

### Phase 8: Announce Release

**GitHub**: Release notes automatically posted

**Optional Announcements**:
- Twitter/X: Share link to release
- Reddit (r/dotnet, r/csharp): Post announcement
- Dev.to: Write blog post
- Hacker News: Submit link
- LinkedIn: Share release note

---

## Post-Release Tasks

### Monitor for Issues

- Watch GitHub issues for bug reports
- Monitor release download statistics
- Review user feedback
- Create hotfix branch if critical bugs found

### Prepare for Next Release

- Create `Phase 2` milestone
- Plan next features (NuGet support, multi-language)
- Update project board with Phase 2 tasks
- Bump version to `0.2.0-dev` in main branch

---

## Troubleshooting

### Build Failures

**Error**: `cannot find module 'electron-builder'`
- **Fix**: Run `npm install` to ensure all dependencies installed

**Error**: `Icon file not found`
- **Fix**: Run `npm run generate-icons` to create platform icons

**Error**: `NSIS download failed`
- **Fix**: Check internet connection, electron-builder will retry

### Platform-Specific Issues

**Windows**: Code signing warnings
- **Solution**: Users can click "More info" → "Run anyway"
- **Future**: Obtain code signing certificate for trusted installers

**macOS**: "App is damaged and can't be opened"
- **Solution**: Right-click app → Open (or use: `xattr -cr CodePad.app`)
- **Future**: Sign app with Apple Developer certificate

**Linux**: AppImage won't execute
- **Solution**: Make executable: `chmod +x CodePad-0.1.0.AppImage`

---

## Rollback Procedure

If critical issues discovered post-release:

1. **Mark release as problematic**:
   ```bash
   gh release edit v0.1.0 --draft
   ```

2. **Create hotfix branch**:
   ```bash
   git checkout -b hotfix/v0.1.1 v0.1.0
   # Fix critical issues
   git commit -m "fix: Critical bug fix"
   ```

3. **Build and test hotfix packages**

4. **Release hotfix**:
   ```bash
   git tag v0.1.1
   git push origin v0.1.1
   gh release create v0.1.1 --title "CodePad v0.1.1 - Hotfix" ...
   ```

---

## Release Checklist

Use this checklist for each release:

### Pre-Release
- [ ] Code complete and all features working
- [ ] All tests passing (unit + E2E)
- [ ] CI/CD green (lint, typecheck, build)
- [ ] Version number updated in package.json
- [ ] CHANGELOG.md updated
- [ ] Release notes written
- [ ] Icons generated

### Build
- [ ] Linux AppImage built and tested
- [ ] Linux .deb built and tested
- [ ] Windows installer built and tested (if available)
- [ ] macOS DMG built and tested (if available)

### Release
- [ ] Git tag created and pushed
- [ ] GitHub release created
- [ ] Release notes published
- [ ] Assets uploaded
- [ ] Documentation updated (README, Wiki)

### Post-Release
- [ ] Issues closed
- [ ] Project board updated
- [ ] Announcements posted
- [ ] Monitoring for issues

---

## Contact

For questions about the release process:
- **GitHub**: https://github.com/treytomes/code-pad
- **Issues**: https://github.com/treytomes/code-pad/issues
- **Wiki**: https://github.com/treytomes/code-pad/wiki

---

**Document Version**: 1.0  
**Last Updated**: 2026-05-02  
**Maintainer**: CodePad Team
