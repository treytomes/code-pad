# CodePad

A cross-platform code scratchpad and rapid prototyping tool inspired by LINQPad. Execute code snippets across multiple programming languages without the overhead of creating full projects.

## Features

### ✅ Available Now (Phase 1 MVP - ~85% Complete)

- **C# Code Execution**: Run C# snippets with dotnet-script
- **Monaco Editor**: VS Code's powerful editor with syntax highlighting and IntelliSense
- **Snippet Management**: Create, save, rename, and delete code snippets
- **Real-time Output**: Streaming execution output as code runs
- **Starred Snippets**: Mark favorites for quick access
- **Recently Opened**: Quick access to your recent work
- **Search & Filter**: Find snippets by name or language
- **Import/Export**: Share snippets via .cs files or backup to JSON
- **Keyboard Shortcuts**: Ctrl+S (save), Ctrl+Shift+S (save as), F5 (run), Ctrl+N (new)
- **Error Handling**: Helpful error messages and .NET runtime detection
- **Cross-platform**: Windows, macOS, and Linux support

### 🚧 Coming Soon (Phase 2)

- **Rich Output Visualization**: Beautiful object inspection with `.Dump()` equivalent
- **NuGet Package Support**: Add packages with `#r "nuget:..."` directives
- **Multi-language Support**: Python, JavaScript, and more
- **Database Connectivity**: Query databases directly from snippets
- **Application Menu**: Full menu system with File, Edit, View, Run, Help
- **Settings UI**: Customize editor preferences and execution options

## Development Setup

### Prerequisites

- **Node.js 22.11.0+**: Use nvm to manage Node versions
- **.NET SDK 8.0+**: Required for C# code execution
- **Python 3.11+**: For Python execution support

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd code-pad
   ```

2. **Set Node version** (using nvm):
   ```bash
   nvm use
   # or if not installed: nvm install 22.11.0
   ```

3. **Activate Python virtual environment**:
   ```bash
   source venv/bin/activate  # Linux/macOS
   # or
   venv\Scripts\activate     # Windows
   ```

4. **Install dependencies**:
   ```bash
   # Set Python path for native module compilation (needed for better-sqlite3)
   export PYTHON="$(pwd)/venv/bin/python"
   
   npm install
   ```
   
   **Note**: The Python virtual environment uses Python 3.11, which is required for building
   native Node.js modules. AlmaLinux 8 ships with GCC 8.5, so we use better-sqlite3 v9.6.0
   (requires C++17) instead of the latest version (requires C++20).

5. **Install .NET global tool** (for C# execution):
   ```bash
   dotnet tool install -g dotnet-script
   ```

### VS Code Setup

This project includes VS Code configuration for a smooth development experience:

**Recommended Extensions** (will be suggested automatically):
- ESLint
- Prettier
- TypeScript
- Tailwind CSS IntelliSense
- Python
- Pylance
- Playwright Test
- Vitest Explorer

**Available Tasks** (Ctrl+Shift+P → "Tasks: Run Task"):
- `npm: dev` - Start Vite dev server
- `npm: electron:dev` - Start Electron app
- `npm: build` - Build project (Ctrl+Shift+B)
- `npm: test` - Run tests
- `npm: lint` - Lint code
- `npm: format` - Format code

**Debug Configurations** (F5):
- Debug Main Process - Debug Electron main process
- Debug Renderer Process - Debug React renderer (attach)
- Debug Electron (Main + Renderer) - Debug both
- Run/Debug Vitest Tests - Test debugging

**Quick Start Script**:
```bash
./dev.sh  # Interactive menu to start dev server, electron, tests, etc.
```

### Development Commands

```bash
# Start development server (renderer only)
npm run dev

# Start Electron in development mode
npm run electron:dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build
npm run electron:build
```

### Project Structure

```
code-pad/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # React frontend
│   ├── backend/        # Execution engine
│   ├── shared/         # Shared types/utils
│   └── preload/        # Electron preload script
├── tests/              # Test suite
├── build/              # Build assets
└── dist/               # Build output
```

## Technology Stack

- **Frontend**: React 19, TypeScript, Ant Design, Tailwind CSS
- **Editor**: Monaco Editor
- **Desktop**: Electron
- **State**: Zustand
- **Build**: Vite
- **Testing**: Vitest, Playwright

## Documentation

- [Requirements](REQUIREMENTS.md) - Detailed feature requirements
- [Tech Stack](TECH-STACK.md) - Complete technology specifications
- [Project Plan](PROJECT-PLAN.md) - Development roadmap
- [CLAUDE.md](CLAUDE.md) - AI assistant guidance

## License

MIT License - see [LICENSE](LICENSE) file for details

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Usage

### First Time Setup

1. **Install .NET SDK** (if not already installed):
   - Download from [https://dotnet.microsoft.com/download](https://dotnet.microsoft.com/download)
   - Install .NET 8.0 or later

2. **Install dotnet-script**:
   ```bash
   dotnet tool install -g dotnet-script
   ```

3. **Launch CodePad**:
   - CodePad will automatically detect if requirements are missing
   - Follow on-screen instructions if runtime components are not found

### Quick Start

1. **Create a new snippet**: Click "New" or press Ctrl+N
2. **Write your C# code**: Use the Monaco editor with IntelliSense
3. **Run your code**: Click "Run Code" or press F5
4. **Save your work**: Click "Save As..." or press Ctrl+S
5. **Star favorites**: Click the star icon to mark important snippets
6. **Search snippets**: Use the search box in the sidebar

### Import/Export

- **Export snippet**: Select a snippet and click "Export" to save as .cs file
- **Import snippet**: Click "Import" to load a .cs file as a new snippet
- **Backup all**: Click "Export All" to save all snippets to JSON

### View Logs

If you encounter issues:

```bash
# Linux/macOS/WSL
npm run logs

# Windows
npm run logs:windows
```

Logs are stored in:
- **Linux**: `~/.config/codepad/logs/`
- **macOS**: `~/Library/Logs/codepad/`
- **Windows**: `%APPDATA%\codepad\logs\`

## Status

✅ **Phase 1 MVP: ~85% Complete**

Core features working:
- C# execution ✅
- Snippet management ✅
- Search & filtering ✅
- Import/export ✅
- Error handling ✅
- Comprehensive logging ✅

Next up: Rich output, Application menu, Settings UI
