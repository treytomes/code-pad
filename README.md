# CodePad

A cross-platform code scratchpad and rapid prototyping tool inspired by LINQPad. Execute code snippets across multiple programming languages without the overhead of creating full projects.

## Features

- **Multi-language Support**: C#, Python, JavaScript, and more
- **Rich Output Visualization**: Beautiful object inspection with `.Dump()` equivalent
- **Monaco Editor**: VS Code's editor with full IntelliSense
- **Cross-platform**: Windows, macOS, and Linux
- **Package Management**: NuGet, pip, npm integration
- **Database Connectivity**: Query databases directly from snippets

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

## Status

🚧 **In Development** - Currently in Phase 0 (Foundation)

Target MVP release: ~4 months
