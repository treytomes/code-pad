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
   npm install
   ```

5. **Install .NET global tool** (for C# execution):
   ```bash
   dotnet tool install -g dotnet-script
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
