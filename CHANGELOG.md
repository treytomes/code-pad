# Changelog

All notable changes to CodePad will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-05-02

### Added - Phase 1 MVP Complete 🎉

#### Core Features
- **C# code execution** using dotnet build (replaced dotnet-script for better compatibility)
- **LINQPad-style .Dump() extension method** - Automatically outputs objects as formatted JSON
- **Samples tab** with categorized code examples showcasing features
- Monaco Editor with IntelliSense and syntax highlighting
- Real-time streaming output from code execution
- SQLite database for snippet persistence
- Full CRUD operations for code snippets
- **Configurable execution timeout** (0 = disabled, run indefinitely)
- **Stop button** to cancel running execution immediately

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
- **Two-tab snippet panel**: My Snippets and Samples
- **Application menu** (File, Edit, View, Run, Help)
- **Settings modal** with preferences (Editor, Execution, Appearance)
- **Window state persistence**: Size, position, and maximized state restored on restart
- **Off-screen window protection**: Automatically repositions windows when displays change
- About dialog with version and system info
- Resizable sidebar and output panel with saved dimensions
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
- **Automated E2E tests** with Playwright + Electron (20+ test cases)
- 80%+ unit test coverage (54+ test cases)
- **Separate test configurations**: vitest for unit tests, playwright for E2E
- **CI/CD pipeline** with GitHub Actions (lint, typecheck, test, build)
- **Project configuration**: .claude folder with memory, skills, and agents for AI assistance
- Icon generation scripts (SVG to all formats)
- Complete documentation (README, CHANGELOG, GitHub Wiki)
- GitHub Issues and Project Board for task tracking

#### Settings & Preferences
- Editor: Font size (10-32px), tab size (2/4/8), word wrap, line numbers, minimap
- Execution: Timeout duration (0=disabled, 5s-300s), auto-save
- Appearance: Theme (dark), default panel sizes
- All settings persist across sessions in localStorage

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
- Light theme not available (Phase 2)
- NuGet package support coming in Phase 2
- Single snippet open at a time (tabs in Phase 2)
- C# only (Python/JavaScript in Phase 2)

### Installation Requirements
- .NET SDK 8.0 or later (no additional tools required)

### Bug Fixes
- Fixed off-screen window issue when unplugging external displays
- Fixed test configuration conflicts between vitest and playwright
- Fixed window state persistence edge cases

[unreleased]: https://github.com/treytomes/code-pad/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/treytomes/code-pad/releases/tag/v0.1.0
