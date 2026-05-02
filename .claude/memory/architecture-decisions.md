# Architecture Decisions

This file documents key architectural decisions made for CodePad.

## Technology Stack

### Frontend Framework: React 19 + TypeScript
- **Decision**: Use React with TypeScript for type safety
- **Rationale**: React provides excellent component model, TypeScript catches errors at compile time
- **Trade-off**: Steeper learning curve than vanilla JS, but worth it for maintainability

### Desktop Framework: Electron
- **Decision**: Use Electron for cross-platform desktop app
- **Rationale**: Enables Windows, macOS, and Linux support with single codebase
- **Trade-off**: Larger bundle size, but necessary for cross-platform reach
- **Context Isolation**: Enabled for security (no direct Node.js access in renderer)

### Editor: Monaco Editor
- **Decision**: Use Monaco Editor (VS Code's editor)
- **Rationale**: Industry-standard, excellent IntelliSense, syntax highlighting out-of-box
- **Trade-off**: Larger bundle, but provides professional editing experience

### Database: SQLite with better-sqlite3
- **Decision**: Use SQLite for local storage
- **Rationale**: Serverless, cross-platform, fast for local data
- **Version**: Using v9.6.0 (requires C++17, not C++20) for AlmaLinux 8 compatibility
- **Trade-off**: Not suitable for cloud sync, but fine for local-first approach

### C# Execution: dotnet build (not dotnet-script)
- **Decision**: Switched from dotnet-script to full dotnet build
- **Rationale**: Needed to fix CS1109 error (extension methods in nested classes)
- **Implementation**: Create temp project, compile to .dll, execute with dotnet
- **Trade-off**: Slower compilation, but allows proper C# structure

## Module System

### Main Process: CommonJS
- **Decision**: Use CommonJS for Electron main/preload
- **Rationale**: Electron expects CommonJS, ES modules caused loading issues
- **Config**: `tsconfig.main.json` outputs CommonJS

### Renderer Process: ESM
- **Decision**: Use ES modules for renderer
- **Rationale**: Modern bundlers (Vite) work best with ESM
- **Config**: `tsconfig.json` outputs ESM

## Code Execution Strategy

### Auto-Injection Pattern
- **Decision**: Auto-inject DumpExtensions class into all C# scripts
- **Rationale**: LINQPad-style convenience without manual imports
- **Implementation**: Wrap user code in `Program.Main()`, add `DumpExtensions` as top-level class
- **Why**: Avoids CS1109 error (extension methods must be in top-level static class)

### Output Streaming
- **Decision**: Stream output in real-time via IPC
- **Rationale**: Better UX for long-running tasks, shows progress
- **Implementation**: Auto-flush console, send chunks via `execution-output-chunk` IPC event

## State Management

### Settings Storage: localStorage
- **Decision**: Use localStorage for app settings (not database)
- **Rationale**: Fast, synchronous access, suitable for UI preferences
- **Future**: May migrate to database or config file for persistence across machines

### Window State: JSON file in userData
- **Decision**: Store window bounds/maximized state in `window-state.json`
- **Rationale**: Separate from app settings, managed by main process
- **Location**: `app.getPath('userData')/window-state.json`

## UI/UX Patterns

### Dark Theme First
- **Decision**: Default to dark theme, light theme deferred to Phase 2
- **Rationale**: Target audience (developers) prefers dark themes
- **Colors**: VS Code color scheme for familiarity

### Two-Tab Snippet List
- **Decision**: Split into "My Snippets" and "Samples" tabs (LINQPad pattern)
- **Rationale**: Samples showcase features, help new users discover capabilities
- **Implementation**: Samples in-memory only, not in database

### Rich Output Visualization
- **Decision**: Auto-detect format (JSON/table/HTML/plain) and render appropriately
- **Rationale**: Better than plain text output, matches LINQPad UX
- **Special Case**: Arrays of objects → tables (sortable, filterable)

## Testing Strategy

### Unit Tests: Vitest
- **Decision**: Use Vitest for fast unit testing
- **Coverage Target**: 80%+ for backend, 70%+ for React components
- **Mocking**: Mock Electron APIs and external dependencies

### E2E Tests: Playwright
- **Decision**: Use Playwright for end-to-end testing
- **Rationale**: Official Electron support, cross-browser testing
- **When to Use**: Critical user workflows only (not every feature)

## Development Workflow

### Issue-First Development
- **Decision**: Create GitHub Issue before starting any work
- **Rationale**: Better tracking, clearer requirements, showcases collaboration
- **Exception**: Trivial typo fixes

### Wiki-First Documentation
- **Decision**: All documentation goes to GitHub Wiki, not repo root
- **Rationale**: Cleaner repo, better organization, easier maintenance
- **Exceptions**: README, CHANGELOG, CONTRIBUTING, CLAUDE.md, PROJECT-PLAN.md, LICENSE

## Security Considerations

### Context Isolation: Enabled
- **Decision**: Full context isolation in renderer process
- **Rationale**: Prevents renderer from accessing Node.js directly
- **Implementation**: All IPC through secure context bridge in preload

### Code Execution Sandboxing
- **Decision**: Run user code in separate process
- **Rationale**: Protects app from crashes/hangs in user code
- **Timeout**: 30 second default (configurable)

## WSL Compatibility

### Known Issue: Electron GUI Broken in WSL
- **Decision**: Develop GUI features on Windows, backend on WSL
- **Rationale**: Electron module loading broken in WSL (documented in wiki)
- **Workaround**: Copy project to Windows for GUI testing
- **Future**: May resolve with Electron updates

## Build System

### Bundler: Vite
- **Decision**: Use Vite for fast development and production builds
- **Rationale**: Fast HMR, modern ESM support, optimized production builds
- **Config**: Vite handles renderer, TSC handles main/preload

### Builder: electron-builder
- **Decision**: Use electron-builder for packaging
- **Rationale**: Industry standard, supports all platforms, code signing
- **Future**: Configure for production releases

---

**Last Updated**: 2026-05-02
**Review**: Update when making significant architectural changes
