# Windows Setup Instructions

This project was copied from WSL to Windows because **Electron doesn't work in WSL** (see ELECTRON-WSL-ISSUE.md).

## Quick Start

Open PowerShell and run:

```powershell
cd C:\Users\TreyTomes\projects\code-pad

# Install dependencies (this will take a few minutes)
npm install

# Build the project
npm run build

# Run Electron app
npm run electron:dev
```

**Expected**: A window should appear with "CodePad - Hello World" and a test button.

## What's Missing (Intentionally)

The following directories were NOT copied (they're large and rebuild quickly):
- `node_modules/` - Will be recreated by `npm install`
- `dist/` - Will be recreated by `npm run build`
- `venv/` - Python virtual environment (only needed for WSL)
- `.git/` - Git repository (use the WSL version as the source of truth)

## First Time Setup

### 1. Install Node.js (if not already installed)

Check if Node.js is installed:
```powershell
node --version
```

If not installed:
- Download from: https://nodejs.org/ (LTS version)
- Or use nvm-windows: https://github.com/coreybutler/nvm-windows

### 2. Install .NET SDK (if not already installed)

Check if .NET is installed:
```powershell
dotnet --version
```

If not installed:
- Download from: https://dotnet.microsoft.com/download
- Install .NET 8.0 SDK

### 3. Install dotnet-script

```powershell
dotnet tool install -g dotnet-script
```

### 4. Install Project Dependencies

```powershell
npm install
```

This will:
- Install all Node.js packages
- Download Electron 30
- Build native modules (better-sqlite3)

**Note**: No Python venv needed on Windows - npm handles native builds automatically.

### 5. Build the Project

```powershell
npm run build
```

This compiles:
- TypeScript to JavaScript (main process)
- React components (renderer)
- CSS with Tailwind

### 6. Run Electron

```powershell
npm run electron:dev
```

**You should see a window appear!** If you do, Electron is working correctly on Windows.

## Development Workflow

### Option A: Develop on Windows Only

1. Edit code in VS Code on Windows
2. Build and test on Windows
3. Commit changes on Windows
4. Sync back to WSL if needed

### Option B: Edit in WSL, Test on Windows (Recommended)

1. **Edit** in WSL using VS Code Remote-WSL
   - Better performance
   - Full WSL tooling
   - Familiar Linux environment

2. **Build** in WSL (faster):
   ```bash
   # In WSL
   cd /home/trey/projects/code-pad
   npm run build
   ```

3. **Copy** built files to Windows:
   ```bash
   # In WSL
   cp -r dist /mnt/c/Users/TreyTomes/projects/code-pad/
   ```

4. **Test** GUI on Windows:
   ```powershell
   # In Windows PowerShell
   cd C:\Users\TreyTomes\projects\code-pad
   npm run electron:dev
   ```

5. **Commit** from WSL:
   ```bash
   # In WSL
   cd /home/trey/projects/code-pad
   git add -A
   git commit -m "Your message"
   git push
   ```

### Option C: Develop Entirely on Windows

If WSL is too complicated, just develop on Windows:

1. Open PowerShell
2. `cd C:\Users\TreyTomes\projects\code-pad`
3. Edit files in VS Code (Windows version)
4. Build with `npm run build`
5. Test with `npm run electron:dev`
6. Use Git for Windows to commit

## VS Code on Windows

Install VS Code for Windows:
- Download: https://code.visualstudio.com/

Recommended extensions:
- ESLint
- Prettier
- TypeScript
- Tailwind CSS IntelliSense

Open the project:
```powershell
cd C:\Users\TreyTomes\projects\code-pad
code .
```

## Troubleshooting

### "npm command not found"
Install Node.js from https://nodejs.org/

### "dotnet command not found"
Install .NET SDK from https://dotnet.microsoft.com/download

### Electron window doesn't appear
1. Check Windows Defender / Antivirus
2. Check if Electron is blocked by corporate firewall
3. Try running as Administrator
4. Check console output for errors

### Build errors
1. Delete `node_modules/` and `package-lock.json`
2. Run `npm install` again
3. Run `npm run build`

### "Cannot find module"
Run `npm install` to reinstall dependencies

## Syncing Between WSL and Windows

### Copy WSL → Windows
```bash
# From WSL
cp -r /home/trey/projects/code-pad /mnt/c/Users/TreyTomes/projects/
```

### Copy Windows → WSL
```powershell
# From PowerShell (not recommended, use Git instead)
robocopy C:\Users\TreyTomes\projects\code-pad \\wsl$\AlmaLinux\home\trey\projects\code-pad /E
```

**Better approach**: Use Git to sync:
1. Commit in one environment
2. Pull in the other environment

## Next Steps

Once Electron is confirmed working on Windows:

1. **Phase 0, Week 2**: Develop C# execution engine
   - Can develop in WSL (no GUI needed)
   - Test backend logic with unit tests

2. **Phase 1, Week 3+**: GUI development
   - Develop on Windows
   - Test Electron app continuously
   - Build UI components

## Important Files

- **claude-journal/quick-reference.md** - Project status
- **claude-journal/2026-05-01-session-summary.md** - Full session notes
- **ELECTRON-WSL-ISSUE.md** - Why we're using Windows
- **PROJECT-PLAN.md** - Development roadmap

## Git Repository

**Source of Truth**: WSL `/home/trey/projects/code-pad`

Commit changes there, not on Windows (unless you initialize Git on Windows too).

To initialize Git on Windows:
```powershell
cd C:\Users\TreyTomes\projects\code-pad
git init
git remote add origin <your-repo-url>
git pull origin main
```

---

**Setup Date**: 2026-05-01  
**Copied From**: WSL `/home/trey/projects/code-pad`  
**Purpose**: GUI development (Electron works on Windows, not WSL)
