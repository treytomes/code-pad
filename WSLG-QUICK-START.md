# WSLg Quick Start - Enable Electron GUI

## Prerequisites Check

✅ **WSLg is available** on your system:
```bash
echo $DISPLAY
# Should show: :0
```

Your system has WSLg enabled, which means you can run GUI applications!

## Install Required Libraries

Electron needs GTK3 and accessibility libraries. Run one of these:

### Option 1: Automated Script (Recommended)

```bash
sudo ./setup-wslg.sh
```

This will:
1. Install all required packages
2. Test Electron automatically
3. Confirm everything works

### Option 2: Manual Installation

```bash
sudo dnf install -y \
    gtk3 \
    libXScrnSaver \
    libXtst \
    nss \
    at-spi2-atk \
    cups-libs \
    libdrm \
    mesa-libgbm \
    alsa-lib \
    libatomic
```

## Test Electron

After installing dependencies:

```bash
npm run electron:dev
```

You should see the CodePad window appear!

## Troubleshooting

### "command not found: dnf"
Your system might use `yum` instead:
```bash
sudo yum install -y gtk3 libXScrnSaver libXtst nss at-spi2-atk cups-libs libdrm mesa-libgbm alsa-lib libatomic
```

### "DISPLAY not set"
WSLg requires Windows 11 or Windows 10 Build 19044+

Check your Windows version:
```powershell
# Run in Windows PowerShell
winver
```

Update Windows if needed, then restart WSL:
```powershell
wsl --shutdown
wsl
```

### "Permission denied"
Make sure to use `sudo` for package installation.

### Electron window doesn't appear
1. Check for error messages in terminal
2. Verify DISPLAY is set: `echo $DISPLAY`
3. Try running a simple GUI app: `xeyes` or `xclock`
4. If those don't work, WSLg may need troubleshooting

### "libGL error: failed to load driver"
This is usually just a warning and can be ignored if the app runs.

## What is WSLg?

**WSLg** (Windows Subsystem for Linux GUI) allows Linux GUI applications to run on Windows with native-like performance. It was added in Windows 11 and backported to Windows 10 Build 19044+.

**How it works**:
- Weston compositor runs in a VM
- GUI apps render through Wayland or X11
- Windows displays them as native windows

**Benefits for CodePad**:
- ✅ Develop in Linux environment (WSL)
- ✅ Test GUI directly without leaving WSL
- ✅ Full Electron debugging in native environment
- ✅ No X11 server setup needed

## After Setup

Once working, you can:

1. **Run development server**:
   ```bash
   npm run electron:dev
   ```

2. **Debug in VS Code**:
   - Press `F5`
   - Or Debug panel → "Debug Main Process"

3. **Build and test**:
   ```bash
   npm run build
   npm run electron:dev
   ```

## Corporate Environment Note

This installation requires `sudo` privileges. If you don't have sudo access:

1. **Submit IT ticket** to install the packages listed above
2. **Or** use Windows native development (see WSL-SETUP.md Option 5)
3. **Or** continue with build-only workflow (testing on Windows periodically)

## Verify Installation

Check installed packages:
```bash
dnf list installed | grep -E 'gtk3|libXScrnSaver|libXtst|at-spi2-atk'
```

Should show all packages installed.

## Resources

- [WSLg Documentation](https://github.com/microsoft/wslg)
- [WSLg Troubleshooting](https://github.com/microsoft/wslg/wiki/Diagnosing-%22cannot-open-display%22-type-issues-with-WSLg)
- [Electron Linux Prerequisites](https://www.electronjs.org/docs/latest/development/build-instructions-linux)

---

**Status**: WSLg is available on your system. Just need to install GTK libraries!

**Next**: Run `sudo ./setup-wslg.sh` and you'll be testing Electron in seconds!
