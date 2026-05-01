# Setup Scripts Documentation

This directory contains automated setup scripts for Windows development.

---

## Quick Start

**For first-time setup**, run:

```batch
setup-dev.bat
```

This will:
1. Create Python virtual environment
2. Install all npm dependencies
3. Build the application

**Time**: ~5-10 minutes depending on internet speed

---

## Available Scripts

### 1. `setup-python.bat` (Batch)

**Purpose**: Creates and activates Python virtual environment

**Usage**:
```batch
setup-python.bat
```

**What it does**:
- ✅ Checks if Python is installed
- ✅ Creates `venv-win/` virtual environment (if needed)
- ✅ Activates the virtual environment
- ✅ Upgrades pip
- ✅ Installs packages from `requirements.txt` (if exists)
- ✅ Sets `PYTHON` environment variable for npm

**When to use**:
- Before running `npm install` for the first time
- After cloning the repo on a new machine
- When you need to use the Python venv

**Output**:
```
========================================
CodePad - Python Environment Setup
========================================

[INFO] Found Python: Python 3.11.0
[INFO] Creating virtual environment...
[SUCCESS] Virtual environment created
[INFO] Activating virtual environment...
[SUCCESS] Virtual environment activated
[INFO] Upgrading pip...
[SUCCESS] All requirements installed
[INFO] Set PYTHON=C:\...\venv-win\Scripts\python.exe

========================================
Setup Complete!
========================================
```

---

### 2. `setup-python.ps1` (PowerShell)

**Purpose**: Same as `setup-python.bat` but for PowerShell

**Usage**:
```powershell
.\setup-python.ps1
```

**Features**:
- ✅ Color-coded output (better UX)
- ✅ Python version validation (requires 3.8+)
- ✅ Better error messages
- ✅ Execution policy detection

**When to use**:
- If you prefer PowerShell over Command Prompt
- If you want better error messages
- If you're writing scripts that call this

**Note**: May require execution policy adjustment:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### 3. `setup-dev.bat` (Complete Setup)

**Purpose**: Full end-to-end development environment setup

**Usage**:
```batch
setup-dev.bat
```

**What it does**:
1. **Step 1/3**: Runs `setup-python.bat`
2. **Step 2/3**: Runs `npm install` (clean install)
3. **Step 3/3**: Runs `npm run build`

**When to use**:
- 🎯 First time setting up the project
- 🎯 After pulling major changes
- 🎯 After deleting `node_modules/`
- 🎯 When npm install or build is broken

**Output**:
```
========================================
CodePad - Complete Dev Setup
========================================

[STEP 1/3] Setting up Python environment...
[STEP 2/3] Installing npm dependencies...
[STEP 3/3] Building application...

========================================
Setup Complete!
========================================

All steps completed successfully:
  [x] Python virtual environment created
  [x] npm dependencies installed
  [x] Application built
```

---

## Prerequisites

Before running any setup script, ensure you have:

### Required

1. **Node.js 18+**
   - Download: https://nodejs.org/
   - Or: `choco install nodejs-lts`
   - Verify: `node --version`

2. **Python 3.8+**
   - Download: https://www.python.org/downloads/
   - Or: `choco install python`
   - Verify: `python --version`
   - ⚠️ Make sure "Add Python to PATH" is checked during install

### Optional

3. **Visual Studio Build Tools** (for native modules)
   - Automatically installed by npm if needed
   - Or: `choco install visualstudio2022buildtools`

4. **Git for Windows**
   - Download: https://git-scm.com/download/win
   - Or: `choco install git`

---

## Troubleshooting

### Python Not Found

**Error**:
```
'python' is not recognized as an internal or external command
```

**Solution**:
1. Install Python from https://www.python.org/downloads/
2. Make sure "Add Python to PATH" is checked
3. Or add Python manually to PATH:
   - Control Panel → System → Advanced → Environment Variables
   - Add `C:\Python311\` to PATH (adjust version as needed)

---

### Node.js Not Found

**Error**:
```
'node' is not recognized as an internal or external command
```

**Solution**:
1. Install Node.js from https://nodejs.org/
2. Restart your terminal/command prompt
3. Verify: `node --version`

---

### PowerShell Execution Policy

**Error**:
```
cannot be loaded because running scripts is disabled on this system
```

**Solution**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then run the script again.

---

### npm Install Fails

**Error**:
```
gyp ERR! stack Error: `gyp` failed with exit code: 1
```

**Solution**:
1. Make sure Python is installed and in PATH
2. Run `setup-python.bat` first
3. Then try `npm install` again

If still failing:
```batch
REM Clean slate
rmdir /s /q node_modules
del package-lock.json

REM Setup Python
setup-python.bat

REM Try again
npm install
```

---

### Build Fails

**Error**:
```
tsc: command not found
```

**Solution**:
This means `npm install` didn't complete successfully.

1. Delete `node_modules/` and `package-lock.json`
2. Run `setup-dev.bat` to start fresh

---

## Environment Variables

The setup scripts set these environment variables:

| Variable | Value | Purpose |
|----------|-------|---------|
| `PYTHON` | `venv-win\Scripts\python.exe` | Points npm to correct Python for native builds |

**Note**: These are set for the current terminal session only. Run the setup script again in new terminals.

---

## File Structure

After running setup scripts:

```
code-pad/
├── venv-win/              ← Python virtual environment (created)
│   ├── Scripts/
│   │   ├── python.exe     ← Python executable
│   │   ├── Activate.ps1   ← PowerShell activation
│   │   └── activate.bat   ← Batch activation
│   └── Lib/
│
├── node_modules/          ← npm dependencies (created)
│   └── ...
│
├── dist/                  ← Build output (created)
│   ├── main/
│   ├── preload/
│   └── renderer/
│
├── setup-python.bat       ← Python setup (batch)
├── setup-python.ps1       ← Python setup (PowerShell)
├── setup-dev.bat          ← Complete setup (batch)
└── requirements.txt       ← Python dependencies (empty for now)
```

---

## Manual Setup (Alternative)

If you prefer to run steps manually:

### Step 1: Python Virtual Environment

```batch
REM Create venv
python -m venv venv-win

REM Activate (Batch)
venv-win\Scripts\activate.bat

REM Or activate (PowerShell)
.\venv-win\Scripts\Activate.ps1

REM Set environment variable
set PYTHON=%CD%\venv-win\Scripts\python.exe
```

### Step 2: Install npm Dependencies

```batch
npm install
```

### Step 3: Build

```batch
npm run build
```

### Step 4: Run

```batch
npm run electron:dev
```

---

## CI/CD Integration

For automated builds (GitHub Actions, etc.):

```yaml
# .github/workflows/build.yml
steps:
  - name: Setup Python
    uses: actions/setup-python@v4
    with:
      python-version: '3.11'

  - name: Setup Node.js
    uses: actions/setup-node@v3
    with:
      node-version: '22'

  - name: Install dependencies
    run: npm install

  - name: Build
    run: npm run build

  - name: Test
    run: npm test
```

Note: CI/CD doesn't need the virtual environment setup since it uses system Python.

---

## Development Workflow

### First Time Setup
```batch
setup-dev.bat
```

### Daily Development

```batch
REM Start dev server (auto-reload)
npm run dev

REM In another terminal, run Electron
npm run electron:dev
```

### After Pulling Changes

```batch
REM If package.json changed
npm install

REM Rebuild
npm run build

REM Test
npm run electron:dev
```

### Before Committing

```batch
REM Lint code
npm run lint

REM Format code
npm run format

REM Run tests
npm test
```

---

## Related Documentation

- `WINDOWS-SETUP.md` - Full Windows development guide
- `BUILD_ERROR_ANALYSIS.md` - Troubleshooting build errors
- `README.md` - General project information
- `CLAUDE.md` - Development guidance

---

## FAQ

**Q: Do I need to run the setup script every time?**  
A: No, only:
- First time setup
- After deleting `node_modules/`
- After major version updates
- When switching branches that change dependencies

**Q: Can I use WSL instead of Windows?**  
A: For building, no. Electron needs to be built on Windows with Windows tools. But you can use WSL for editing code and Git operations.

**Q: Which script should I use: .bat or .ps1?**  
A: 
- Use `.bat` for Command Prompt
- Use `.ps1` for PowerShell (better output)
- Both do the same thing

**Q: Why do I need Python?**  
A: The `better-sqlite3` package (database) requires Python for compiling native C++ code during installation.

**Q: Can I use a different Python version?**  
A: Yes, any Python 3.8+ works. The scripts will validate the version.

**Q: What if I already have a Python virtual environment?**  
A: The script will detect it and skip creation. It will just activate it.

---

**Last Updated**: 2026-05-01  
**Tested On**: Windows 10/11, Python 3.11, Node.js 22  
**Status**: Ready for use
