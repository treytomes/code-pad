# CLAUDE.md - CodePad Project

## Project Overview

**CodePad** is a cross-platform alternative to LINQPad - a rapid development tool and code scratchpad for .NET developers.

### What is LINQPad?

LINQPad is a Windows/.NET tool that serves as "The .NET Programmer's Playground". It allows developers to:
- Instantly test C#/F#/VB snippets or full programs
- Query databases using LINQ or SQL
- Prototype code rapidly without creating full console projects
- Experience rich output formatting and interactive debugging
- Reference NuGet packages and custom assemblies

### Our Goal

Create a **cross-platform** (Linux, macOS, Windows) version that supports multiple languages and runtimes:
- .NET (C#, F#, VB)
- Python
- JavaScript/TypeScript (Node.js)
- Go
- Rust
- Java

## Project Structure

```
code-pad/
├── CLAUDE.md              # This file - project guidance
├── REQUIREMENTS.md        # Detailed requirements document
├── docs/                  # Documentation
├── src/                   # Source code
│   ├── frontend/         # UI (Electron or web-based)
│   ├── backend/          # Language execution engine
│   └── shared/           # Shared utilities
└── tests/                # Test suite
```

## Technology Stack (TBD)

Options to explore:
- **Frontend**: Electron, Tauri, or web-based (React/Vue)
- **Backend**: Language-agnostic execution engine
- **Editor**: Monaco Editor (VS Code's editor component)
- **Database**: SQLite for local storage, support for multiple DB drivers

## Development Guidelines

- **Cross-platform first**: All features must work on Linux, macOS, and Windows
- **Language agnostic**: Architecture should support adding new languages easily
- **Security**: Sandboxed execution of user code
- **Performance**: Fast startup, responsive UI
- **Offline-capable**: Core features work without internet

## Key Differentiators from LINQPad

1. **Multi-language support** - Not just .NET
2. **Cross-platform** - Native support for Linux, macOS, Windows
3. **Open architecture** - Extensible for new languages
4. **Modern UI** - Web technologies for consistent experience
5. **Cloud integration** - Optional sync/sharing features

## Next Steps

1. Complete requirements document
2. Choose technology stack
3. Create proof-of-concept for multi-language execution
4. Design UI/UX mockups
5. Build MVP with C# and Python support
