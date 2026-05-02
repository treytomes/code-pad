# Installing CodePad on Linux

## Prerequisites

- **Modern Linux distribution** (Ubuntu 20.04+, Fedora 35+, or equivalent)
- **.NET SDK 8.0+** - [Download from Microsoft](https://dotnet.microsoft.com/download)

## Choose Your Installation Method

CodePad is available in two formats for Linux:

1. **AppImage** (Portable, no installation required)
2. **.deb Package** (For Debian/Ubuntu-based systems)

---

## Method 1: AppImage (Recommended for most users)

### Download

Download [CodePad-0.1.0.AppImage](https://github.com/treytomes/code-pad/releases/download/v0.1.0/CodePad-0.1.0.AppImage)

### Installation Steps

```bash
# 1. Make the AppImage executable
chmod +x CodePad-0.1.0.AppImage

# 2. Run CodePad
./CodePad-0.1.0.AppImage
```

### Optional: Add to Applications Menu

```bash
# Create desktop entry
cat > ~/.local/share/applications/codepad.desktop << 'EOF'
[Desktop Entry]
Name=CodePad
Comment=Code scratchpad for C# prototyping
Exec=/path/to/CodePad-0.1.0.AppImage
Icon=codepad
Terminal=false
Type=Application
Categories=Development;IDE;
EOF

# Update path in the desktop file
sed -i "s|/path/to|$PWD|" ~/.local/share/applications/codepad.desktop

# Update desktop database
update-desktop-database ~/.local/share/applications/
```

### Advantages
- ✅ No root privileges required
- ✅ Portable - run from anywhere
- ✅ No conflicts with system packages
- ✅ Easy to uninstall (just delete the file)

---

## Method 2: .deb Package (Debian/Ubuntu)

### Download

Download [CodePad_0.1.0_amd64.deb](https://github.com/treytomes/code-pad/releases/download/v0.1.0/CodePad_0.1.0_amd64.deb)

### Installation Steps

```bash
# Install with apt
sudo apt install ./CodePad_0.1.0_amd64.deb

# Or with dpkg
sudo dpkg -i CodePad_0.1.0_amd64.deb
```

### Launch CodePad

After installation:

```bash
# From command line
codepad

# Or search for "CodePad" in your applications menu
```

### Uninstallation

```bash
sudo apt remove codepad
```

### Advantages
- ✅ System-wide installation
- ✅ Automatic desktop menu integration
- ✅ Standard package management

---

## Install .NET SDK

CodePad requires .NET SDK 8.0 or later to execute C# code.

### Ubuntu/Debian

```bash
# Add Microsoft package repository
wget https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb

# Install .NET SDK
sudo apt update
sudo apt install dotnet-sdk-8.0
```

### Fedora

```bash
sudo dnf install dotnet-sdk-8.0
```

### Arch Linux

```bash
sudo pacman -S dotnet-sdk
```

### Verify Installation

```bash
dotnet --version
# Should show: 8.0.x or higher
```

---

## First Launch

1. Launch CodePad (AppImage or via menu)
2. If .NET SDK is not detected, a warning will appear with installation instructions
3. Once .NET SDK is installed, restart CodePad
4. Click the **Samples** tab to try example code
5. Press **F5** to execute code

---

## Troubleshooting

### AppImage won't execute

**Error**: "Permission denied"
```bash
chmod +x CodePad-0.1.0.AppImage
```

**Error**: "AppImage cannot be mounted"
- Install FUSE support:
  ```bash
  # Ubuntu/Debian
  sudo apt install libfuse2
  
  # Fedora
  sudo dnf install fuse-libs
  ```

### .deb installation fails

**Error**: "Dependency problems"
```bash
# Fix broken dependencies
sudo apt --fix-broken install
```

### .NET SDK not found

**Check if .NET is installed**:
```bash
which dotnet
dotnet --list-sdks
```

**If not installed**, follow .NET SDK installation steps above.

**If installed but not detected**:
- Restart CodePad
- Check PATH includes `/usr/bin` or SDK installation directory

### Application won't start

**Check logs**:
```bash
# View CodePad logs
tail -f ~/.config/codepad/logs/main.log
```

**Common issues**:
- Missing dependencies (install via package manager)
- Display server issues (ensure X11/Wayland running)

---

## System Requirements

### Minimum
- **OS**: Ubuntu 20.04+ / Fedora 35+ / Debian 11+ / equivalent
- **RAM**: 4 GB
- **Disk**: 500 MB for CodePad + 2 GB for .NET SDK
- **Display**: 1280x720 resolution

### Recommended
- **OS**: Latest LTS version of your distribution
- **RAM**: 8 GB+
- **Disk**: SSD for faster startup
- **Display**: 1920x1080 or higher

---

## Supported Distributions

CodePad has been tested on:
- ✅ Ubuntu 22.04 LTS (Jammy Jellyfish)
- ✅ Ubuntu 24.04 LTS (Noble Numbat)
- ✅ Fedora 40
- ✅ Debian 12 (Bookworm)
- ✅ Linux Mint 21
- ✅ Pop!_OS 22.04

Should also work on:
- Arch Linux
- Manjaro
- openSUSE Leap
- Most modern distributions with glibc 2.31+

---

## Getting Started

Once installed, check out:
- [Quick Start Guide](https://github.com/treytomes/code-pad/wiki/Quick-Start)
- [Keyboard Shortcuts](https://github.com/treytomes/code-pad/wiki/Keyboard-Shortcuts)
- [.Dump() Extension Guide](https://github.com/treytomes/code-pad/wiki/Dump-Extension)

---

## Need Help?

- **Issues**: [GitHub Issues](https://github.com/treytomes/code-pad/issues)
- **Discussions**: [GitHub Discussions](https://github.com/treytomes/code-pad/discussions)
- **Wiki**: [Full Documentation](https://github.com/treytomes/code-pad/wiki)

---

**Last Updated**: 2026-05-02  
**Version**: 0.1.0
