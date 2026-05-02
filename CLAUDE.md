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
- .NET (C#, F#, VB) - **Primary focus for MVP**
- Python
- JavaScript/TypeScript (Node.js)
- Go
- Rust
- Java

---

## Current Project Status (2026-05-01)

### Phase Complete ✅
**Phase 0 Week 1 - Foundation**: COMPLETE

### What's Built ✅
- ✅ Full project documentation (9 files, 1200+ lines)
- ✅ Build system (TypeScript, Vite, ESLint, Prettier)
- ✅ All dependencies installed (React 19, Electron 30, Monaco Editor, Ant Design, Zustand, better-sqlite3)
- ✅ VS Code workspace fully configured (tasks, debugging, extensions)
- ✅ Source code written (Electron main, preload, React renderer)
- ✅ Python 3.11 venv for native module builds
- ✅ WSLg configured with GTK libraries
- ✅ Project copied to Windows for GUI testing

### Known Issues ⚠️
**CRITICAL**: Electron module loading broken in WSL (see ELECTRON-WSL-ISSUE.md)
- Symptom: `require('electron')` returns undefined exports even when running inside Electron
- Impact: Cannot test GUI in WSL
- Workaround: Use Windows for GUI development (project copied to `C:\Users\TreyTomes\projects\code-pad`)
- Backend development unaffected: C# execution, database, tests can all be done in WSL

### Next Phase 📋
**Phase 0 Week 2 - Backend PoCs** (Can be done in WSL):
1. C# Execution Engine (Days 1-2)
   - Install: `dotnet tool install -g dotnet-script`
   - Implement: `src/backend/executors/csharp.ts`
   - Test: Execute C# code via `dotnet script file.csx`
2. Database Layer (Days 3-4)
   - Implement: `src/backend/database.ts`
   - Schema: snippets, tags, settings tables
   - Use: better-sqlite3 (already installed)

---

## Project Structure (Actual)

```
code-pad/
├── CLAUDE.md                      # This file - project guidance
├── START-HERE.md                  # Quick entry point for new sessions
├── README.md                      # User-facing documentation
├── REQUIREMENTS.md                # Detailed feature specifications
├── TECH-STACK.md                  # Technology decisions
├── PROJECT-PLAN.md                # 4-phase development roadmap
├── ELECTRON-WSL-ISSUE.md          # Critical Electron blocker documentation
├── WINDOWS-SETUP.md               # Windows development instructions
├── WSL-SETUP.md                   # WSL environment documentation
├── WSLG-QUICK-START.md           # WSLg GUI setup guide
│
├── claude-journal/                # Session continuity notes
│   ├── README.md                  # About the journal
│   ├── quick-reference.md         # Quick status (read this first!)
│   └── 2026-05-01-session-summary.md  # Full session log
│
├── src/
│   ├── main/index.ts              # Electron main process (CommonJS)
│   ├── preload/index.ts           # Context bridge for security
│   ├── renderer/                  # React frontend (ESM)
│   │   ├── App.tsx                # Main React component
│   │   ├── index.tsx              # React entry point
│   │   ├── components/            # UI components (to be built)
│   │   ├── stores/                # Zustand state management
│   │   └── styles/index.css       # Tailwind CSS
│   ├── backend/                   # Execution engine (to be built)
│   │   ├── executors/             # Language-specific executors
│   │   │   └── csharp.ts          # C# executor (Phase 0 Week 2)
│   │   └── database.ts            # SQLite wrapper (Phase 0 Week 2)
│   └── shared/types.ts            # TypeScript interfaces
│
├── tests/                         # Test suite
│   ├── unit/                      # Unit tests (Vitest)
│   ├── integration/               # Integration tests
│   └── e2e/                       # E2E tests (Playwright)
│
├── .vscode/                       # VS Code configuration
│   ├── tasks.json                 # 12 npm task definitions
│   ├── launch.json                # Debug configurations
│   ├── settings.json              # Workspace settings
│   └── extensions.json            # Recommended extensions
│
├── venv/                          # Python 3.11 virtual environment
├── node_modules/                  # npm dependencies
├── dist/                          # Build output
│   ├── main/index.js              # Compiled main process (CommonJS)
│   ├── preload/index.js           # Compiled preload
│   └── renderer/                  # Built React app
├── package.json                   # npm configuration (NO "type": "module")
├── tsconfig.json                  # TypeScript config (renderer - ESM)
├── tsconfig.main.json             # TypeScript config (main/backend - CommonJS)
└── vite.config.ts                 # Vite bundler configuration
```

---

## Technology Stack (DECIDED ✅)

### Frontend
- **Framework**: React 19 with TypeScript
- **Desktop**: Electron 30 (downgraded from 41 for testing, can upgrade later)
- **Editor**: Monaco Editor (VS Code's editor component)
- **UI Components**: Ant Design
- **State Management**: Zustand
- **Styling**: Tailwind CSS + CSS Modules
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js 22.11.0 (via nvm)
- **Language**: TypeScript
- **Module System**: CommonJS for main/backend, ESM for renderer
- **Database**: SQLite with better-sqlite3 v9.6.0
- **C# Execution**: dotnet-script (via `dotnet script` CLI)

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Formatting**: Prettier
- **Git Hooks**: Husky + lint-staged
- **Testing**: Vitest (unit), Playwright (E2E)

---

## Important Technical Decisions

### 1. Module Format: CommonJS vs ESM
**Decision**: Use CommonJS for Electron main/preload, ESM for renderer
**Reason**: Electron expects CommonJS. ES modules caused module loading issues.
**Implementation**: 
- `package.json` has NO `"type": "module"`
- `tsconfig.main.json` outputs CommonJS
- `tsconfig.json` outputs ESM for renderer

### 2. better-sqlite3 Version
**Decision**: Use v9.6.0 instead of latest (v12+)
**Reason**: AlmaLinux 8 has GCC 8.5 which only supports C++17, not C++20
**Workaround**: Python 3.11 venv for building native modules
**Command**: `export PYTHON="$(pwd)/venv/bin/python" && npm install`

### 3. Electron Version
**Decision**: Currently using Electron 30 (downgraded from 41)
**Reason**: Testing if version was the issue (it wasn't - WSL issue)
**Future**: Can upgrade to 41+ once Electron works (test on Windows first)

### 4. Development Environment Split
**Decision**: Backend dev in WSL, GUI dev on Windows
**Reason**: Electron module loading broken in WSL (documented in ELECTRON-WSL-ISSUE.md)
**Workflow**:
- Edit code: WSL (VS Code Remote-WSL)
- Backend/tests: WSL (no GUI needed)
- GUI testing: Windows (copy or sync via Git)

---

## Environment-Specific Notes

### WSL (AlmaLinux 8.10)
**What Works**:
- ✅ Build system (TypeScript, Vite)
- ✅ All dependencies
- ✅ Backend development
- ✅ Unit tests
- ✅ Database operations (SQLite)
- ✅ VS Code Remote-WSL

**What's Blocked**:
- ❌ Electron GUI (module loading issue)
- See: ELECTRON-WSL-ISSUE.md for full details

**Setup Requirements**:
- Python 3.11 venv: `source venv/bin/activate`
- For npm install: `export PYTHON="$(pwd)/venv/bin/python"`
- WSLg GUI libraries already installed (gtk3, etc.)

### Windows (C:\Users\TreyTomes\projects\code-pad)
**What Works**:
- ✅ Everything (no known blockers)
- ✅ Electron GUI (expected to work, needs testing)

**Setup**:
1. `npm install` (no Python venv needed)
2. `npm run build`
3. `npm run electron:dev`

See: WINDOWS-SETUP.md for detailed instructions

---

## Critical Files for Resuming Work

### Session Continuity
1. **START-HERE.md** - Read this first! (2 min)
2. **claude-journal/quick-reference.md** - Quick status and next steps (2 min)
3. **claude-journal/2026-05-01-session-summary.md** - Complete session log (10 min)

### Technical Reference
1. **TECH-STACK.md** - All technology decisions explained
2. **PROJECT-PLAN.md** - Phase 0 Week 2 tasks in detail
3. **REQUIREMENTS.md** - Feature specifications

### Issue Documentation
1. **ELECTRON-WSL-ISSUE.md** - Why GUI blocked in WSL, workarounds
2. **WINDOWS-SETUP.md** - How to set up and run on Windows
3. **WSL-SETUP.md** - WSL environment details

---

## Commands Quick Reference

### Development (WSL)
```bash
# Activate Python venv (for npm install with native modules)
source venv/bin/activate
export PYTHON="$(pwd)/venv/bin/python"

# Build
npm run build                # Full build
npm run build:main          # Main process only (TypeScript → CommonJS)
npm run build:renderer      # Renderer only (Vite → ESM bundle)

# Test (no GUI)
npm test                    # Unit tests with Vitest
npm run lint               # ESLint
npm run format             # Prettier

# GUI (BLOCKED in WSL)
npm run electron:dev       # Won't work, see ELECTRON-WSL-ISSUE.md
```

### Development (Windows)
```powershell
cd C:\Users\TreyTomes\projects\code-pad

# First time setup
npm install
npm run build

# Run GUI (should work!)
npm run electron:dev
```

### VS Code (WSL or Windows)
```
Ctrl+Shift+B     # Build project
F5               # Start debugging
Ctrl+Shift+P     # Command Palette → "Tasks: Run Task"
```

---

## Development Guidelines

### GitHub Issue Workflow

**IMPORTANT**: Always create a GitHub Issue before beginning work on any feature or bug fix.

**Workflow**:
1. **Before starting**: Create a GitHub issue describing the work
   - Use clear, descriptive title
   - Include acceptance criteria and implementation notes
   - Add appropriate labels (enhancement, bug, documentation)
   - Assign to appropriate milestone (v0.1.0, Phase 2, Phase 3, Phase 4)
   - Reference related issues if applicable

2. **During work**: Reference the issue number in commits
   - Use format: `feat: Add feature (#28)` or `fix: Fix bug (closes #28)`
   - Link pull requests to the issue

3. **After completion**: Close the issue
   - Verify all acceptance criteria met
   - Update project board status
   - Link to merged PR or commit

**When to create issues**:
- ✅ New features or enhancements
- ✅ Bug fixes
- ✅ Documentation updates
- ✅ Refactoring work
- ✅ Performance improvements
- ❌ Trivial typo fixes (can skip for obvious typos)
- ❌ Formatting/linting changes (unless substantial)

**Example**:
```bash
# Create issue first
gh issue create --title "Persist output panel height" --label enhancement

# Reference in commit
git commit -m "feat: Persist output panel height across sessions (#28)"

# Close when done
gh issue close 28 --comment "Implemented in commit abc123"
```

**Project Board**: https://github.com/users/treytomes/projects/2 (Public - showcases collaboration)  
**All Issues**: https://github.com/treytomes/code-pad/issues  
**Repository Projects**: https://github.com/treytomes/code-pad/projects

---

### Documentation and Wiki Workflow

**IMPORTANT**: All documentation must be added to the GitHub Wiki, not as markdown files in the repository root.

**Repository Root Files** (only these should exist):
- ✅ `README.md` - Main project readme
- ✅ `CHANGELOG.md` - Release history
- ✅ `CONTRIBUTING.md` - Contribution guidelines
- ✅ `CLAUDE.md` - AI assistant guidance (this file)
- ✅ `PROJECT-PLAN.md` - High-level roadmap
- ✅ `LICENSE` - License file

**Wiki Documentation** (everything else goes here):
- Setup guides (Windows, WSL, Linux, macOS)
- Architecture and design documents
- Technical specifications
- Troubleshooting guides
- API documentation
- Developer guides
- Historical/archived documents

**Workflow**:
1. **Before creating documentation**: Check if similar content exists in the wiki
2. **Create or update wiki pages**: https://github.com/treytomes/code-pad/wiki
3. **Link from README if needed**: Add links to wiki pages in README.md
4. **Never commit documentation to repo root**: Always use wiki

**Adding to Wiki**:
```bash
# Clone wiki repository
git clone git@github.com:treytomes/code-pad.wiki.git /tmp/code-pad-wiki
cd /tmp/code-pad-wiki

# Create new page (use Title-Case-With-Hyphens.md format)
# Example: Setup-Guide-Windows.md, Architecture-Overview.md

# Write content
cat > New-Feature-Guide.md << 'EOF'
# New Feature Guide
...
EOF

# Commit and push
git add .
git commit -m "Add guide for new feature"
git push
```

**Example Wiki Pages**:
- Home.md (Getting Started)
- Architecture.md (System architecture)
- Tech-Stack.md (Technology choices)
- Windows-Setup.md (Setup guide)
- Troubleshooting.md (Common issues)

**Wiki URL**: https://github.com/treytomes/code-pad/wiki

**Why Wiki?**
- Cleaner repository root
- Better navigation and search
- Built-in version history
- Easier to maintain and update
- More accessible for contributors

---

### Unit Testing and Code Coverage

**CRITICAL**: All new code MUST include comprehensive unit tests.

**Coverage Requirements**:
- Backend modules: **80%+ coverage** (executors, database, utilities)
- React components: **70%+ coverage** (UI logic, event handlers)
- Utilities/helpers: **90%+ coverage** (pure functions, no side effects)

**Test Frameworks**:
- **Vitest** for unit/integration tests (`npm test`)
- **React Testing Library** for component tests
- **Playwright** for E2E tests (`npm run test:e2e`)

**Testing Best Practices**:
1. **Write tests FIRST** or immediately after implementation
2. **Test behavior, not implementation** - Focus on what code does, not how
3. **Cover edge cases** - Errors, timeouts, boundary conditions
4. **Keep tests fast** - Mock external dependencies, use test databases
5. **Make tests deterministic** - No flaky tests, no timing dependencies
6. **Use descriptive test names** - Should explain what and why

**Example Test Structure**:
```typescript
describe('FeatureName', () => {
  describe('happyPath', () => {
    it('should do expected thing with valid input', () => {});
  });
  
  describe('edgeCases', () => {
    it('should handle empty input', () => {});
    it('should handle null/undefined', () => {});
    it('should timeout after threshold', () => {});
  });
  
  describe('errorHandling', () => {
    it('should throw on invalid input', () => {});
    it('should log errors appropriately', () => {});
  });
});
```

**Running Tests**:
```bash
# Run all tests
npm test

# Run specific test file
npm test -- csharp.test.ts

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage

# Run tests with UI
npm test -- --ui
```

**Coverage Reporting**:
- Coverage reports generated in `coverage/` directory
- View HTML report: Open `coverage/index.html` in browser
- CI/CD should fail if coverage drops below thresholds

**Before Committing**:
1. ✅ All tests passing
2. ✅ Coverage meets requirements
3. ✅ No console errors/warnings in tests
4. ✅ Tests run in < 30 seconds (unit tests)

---

### Code Style
- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier with 2-space tabs, semicolons, single quotes
- **Linting**: ESLint with React and TypeScript rules
- **Commits**: Use conventional commits, include `Co-Authored-By: Claude`

### Security Best Practices
- ✅ Context isolation enabled in Electron
- ✅ Node integration disabled in renderer
- ✅ Sandbox enabled for renderer
- ✅ Preload script uses context bridge (no direct Node.js access)
- 🔜 Code execution in isolated worker processes (Phase 0 Week 2)
- 🔜 Resource limits and timeouts for user code

### Testing Strategy
- **Unit tests**: Vitest for pure logic (backend, utilities)
- **Integration tests**: Database operations, C# execution
- **E2E tests**: Playwright for full user workflows (GUI)
- **Target**: 70%+ code coverage by Phase 2

---

## Next Session Checklist

When resuming work, do this:

1. ✅ Read `START-HERE.md` (2 min)
2. ✅ Read `claude-journal/quick-reference.md` (2 min)
3. ✅ Check git status: `git status && git log --oneline -5`
4. ✅ Review Phase 0 Week 2 tasks in `PROJECT-PLAN.md`
5. ✅ Decide: Backend dev (WSL) or GUI testing (Windows)

**If Testing GUI on Windows**:
```powershell
cd C:\Users\TreyTomes\projects\code-pad
npm install
npm run electron:dev
```

**If Continuing Backend in WSL**:
```bash
cd /home/trey/projects/code-pad
dotnet tool install -g dotnet-script  # If not installed
# Start Phase 0 Week 2: C# execution engine
```

---

## Key Differentiators from LINQPad

1. ✅ **Multi-language support** - C# first, then Python, JS, Go, Rust, Java
2. ✅ **Cross-platform** - Electron runs on Linux, macOS, Windows
3. ✅ **Open source** - MIT license, community-driven
4. ✅ **Modern UI** - React + Monaco Editor + Ant Design
5. 🔜 **Cloud integration** - Optional sync/sharing (Phase 4)

---

## Git Repository

**Location**: `/home/trey/projects/code-pad` (WSL)  
**Branch**: main  
**Commits**: 13 total (as of 2026-05-01)  
**Status**: All changes committed, repository clean  
**Windows Copy**: `C:\Users\TreyTomes\projects\code-pad` (not a git repo)

**Last Commit**: `baf963a - Add START-HERE.md for easy session resumption`

---

## Important Reminders

### For AI Assistants Resuming Work

1. **Read the journal first**: `claude-journal/quick-reference.md` has the current status
2. **Check for blockers**: ELECTRON-WSL-ISSUE.md documents the GUI blocker
3. **Don't redo completed work**: Phase 0 Week 1 is DONE
4. **Next focus**: Phase 0 Week 2 (C# execution + database) OR test Electron on Windows
5. **Build works**: No need to reconfigure anything, just continue development

### For Humans Resuming Work

1. **Start with START-HERE.md** - Quick overview and decision tree
2. **All documentation is complete** - Don't create new planning docs
3. **Backend can proceed** - GUI blocker doesn't affect C# executor or database work
4. **Windows testing recommended** - Confirm Electron works before continuing GUI work

---

**Last Updated**: 2026-05-01  
**Project Status**: Phase 0 Week 1 Complete ✅  
**Next Phase**: Phase 0 Week 2 - Backend PoCs  
**Blockers**: Electron GUI in WSL (use Windows)  
**Overall Status**: 🟢 Excellent - Ready to proceed
