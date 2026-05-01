# Changelog

All notable changes to CodePad will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-05-01

### Added - Phase 1 MVP Complete 🎉

#### Core Features
- C# code execution with dotnet-script integration
- Monaco Editor with IntelliSense and syntax highlighting
- Real-time streaming output from code execution
- SQLite database for snippet persistence
- Full CRUD operations for code snippets

#### Rich Output Visualization
- Auto-format detection (JSON, tables, HTML, plain text)
- JSON tree view with collapsible nodes and VS Code color scheme
- Table rendering with pagination and sorting
- HTML rendering support
- Intelligent format detection from output

#### Snippet Management
- Create, read, update, delete snippets
- Star/favorite snippets for quick access
- Recently opened snippets tracking (last 5)
- Real-time search by snippet name
- Language filtering (C#)
- Inline rename functionality
- **Duplicate snippet** with one click
- **Unsaved changes tracking** with visual indicator
- Warns before losing unsaved work

#### Import/Export
- Export single snippet to .cs file
- Import .cs/.csx files as snippets
- Export all snippets to JSON backup
- Native file dialogs for save/open

#### User Interface
- **Application menu** (File, Edit, View, Run, Help)
- **Settings modal** with preferences (Editor, Execution, Appearance)
- About dialog with version and system info
- Resizable sidebar and output panel
- Dark theme (VS Code style)
- Three-panel layout (explorer, editor, output)

#### Keyboard Shortcuts
- `F5` - Run code
- `Ctrl+S` / `Cmd+S` - Save
- `Ctrl+Shift+S` / `Cmd+Shift+S` - Save As
- `Ctrl+N` / `Cmd+N` - New snippet
- `Ctrl+O` / `Cmd+O` - Import
- `Ctrl+E` / `Cmd+E` - Export
- `Ctrl+B` / `Cmd+B` - Toggle sidebar
- `Ctrl+J` / `Cmd+J` - Toggle output panel
- `Ctrl+K` / `Cmd+K` - Clear output
- `Ctrl+,` / `Cmd+,` - Settings
- `Ctrl+F` / `Cmd+F` - Find (Monaco built-in)

#### Error Handling & Reliability
- React error boundary for graceful error recovery
- .NET runtime detection with installation guidance
- RuntimeWarning dialog for missing dependencies
- Comprehensive logging with electron-log
- Database migration system for schema updates
- CS1529 fix for using statement ordering

#### Developer Experience
- 80%+ unit test coverage (54+ test cases)
- TESTING-CHECKLIST.md with 297 validation items
- 13 enhanced npm scripts
- Icon generation guide
- Complete documentation (README, PROJECT-PLAN, TESTING-CHECKLIST)
- GitHub repository with full CI/CD

#### Settings & Preferences
- Editor: Font size (10-32px), tab size (2/4/8), word wrap, line numbers, minimap
- Execution: Timeout duration (5s-300s), auto-save
- Appearance: Theme (dark), default panel sizes

#### Performance & Quality
- Streaming output for long-running code
- Execution timing display (real-time updating)
- Execution count tracking per snippet
- Log rotation (10MB max, 3 files)
- Cross-platform support (Windows, macOS, Linux)

### Technical Details
- **Electron 30.5.1** with Node 20.16.0
- **React 19** with TypeScript
- **Monaco Editor** for code editing
- **Ant Design** for UI components
- **SQLite** (better-sqlite3) for data storage
- **Vite** for fast development builds
- **Vitest** for unit testing
- **Playwright** for E2E testing

### Known Limitations
- Execution cancellation not yet implemented (Phase 2)
- Light theme not available (Phase 2)
- NuGet package support coming in Phase 2
- Single snippet open at a time (tabs in Phase 2)
- C# only (Python/JavaScript in Phase 2)

### Installation Requirements
- .NET SDK 8.0 or later
- dotnet-script global tool: `dotnet tool install -g dotnet-script`

[unreleased]: https://github.com/treytomes/code-pad/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/treytomes/code-pad/releases/tag/v0.1.0
