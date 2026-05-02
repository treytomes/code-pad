# CLAUDE.md - CodePad Project

## Project Overview

**CodePad** is a cross-platform code scratchpad inspired by LINQPad - a rapid prototyping tool for C# developers.

### Mission

Enable developers to write, execute, and visualize code instantly without project setup overhead. Focus on exploration, experimentation, and learning.

---

## Current Status (2026-05-02)

### ✅ Phase 1 Complete - v0.1.0 Pre-Release Ready

**What's Built**:
- ✅ C# code execution using dotnet build
- ✅ LINQPad-style .Dump() extension method
- ✅ Samples tab with 12 categorized examples
- ✅ Full snippet management (CRUD, star, search)
- ✅ Window state persistence with off-screen protection
- ✅ Configurable timeout and Stop button
- ✅ Monaco Editor with IntelliSense
- ✅ Settings modal (editor, execution, appearance)
- ✅ Import/Export functionality
- ✅ Automated E2E tests (20+ tests with Playwright)
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ Complete documentation (README, CHANGELOG, Release Notes, Wiki)
- ✅ SVG icon and generation scripts
- ✅ All ESLint errors fixed (commit 5d98f3b)
- ✅ All TypeScript errors fixed (commit aedd59e)

**Remaining for Release**:
- ⏳ Issue #1: CI/CD verification (awaiting GitHub Actions run completion)
- 🎯 Issue #4: Build production packages (Windows, macOS, Linux) and test installers

**Milestone**: [v0.1.0 - Pre-Release](https://github.com/treytomes/code-pad/milestone/1)  
**Project Board**: https://github.com/users/treytomes/projects/2

---

## Development Workflow: Spec-Driven Development

### 🎯 Core Principle

**Write specifications BEFORE implementation code.**

Specifications can be:
1. **GitHub Issue** with detailed acceptance criteria
2. **Feature spec document** in `specs/` directory
3. **Automated tests** that expect the behavior (TDD)
4. **TypeScript interfaces** defining contracts

### Why Spec-Driven Development?

- **Reduces frustration**: Clear requirements before coding eliminates guesswork
- **Improves collaboration**: Anyone can implement from a good spec
- **Prevents scope creep**: Spec is the contract
- **Catches edge cases early**: Thinking through specs reveals corner cases
- **Easier maintenance**: Specs explain "why" when code only shows "how"
- **Refactoring confidence**: Tests based on specs survive implementation changes

### Workflow for New Features

#### 1. **Specification Phase** (Do This First!)

**a) Create GitHub Issue**
```bash
gh issue create --title "Feature: Allow execution timeout to be disabled" \
                --label enhancement \
                --milestone "v0.1.0 - Pre-Release"
```

**b) Write Detailed Specification** (in issue or `specs/` for complex features)

Required sections:
- **User Story**: "As a [role], I want [feature] so that [benefit]"
- **Acceptance Criteria**: Testable checklist of requirements
- **Edge Cases**: Null/empty inputs, boundary conditions, error scenarios
- **API/Interface Contract**: TypeScript interfaces if applicable
- **UI Mockup**: If UI change (screenshot, description, or ASCII art)

**Example Issue Template**:
```markdown
## User Story
As a developer running long data processing tasks, I want to disable the execution timeout so that my script can run until completion without being terminated.

## Acceptance Criteria
- [ ] Settings modal has timeout field accepting 0 (disabled)
- [ ] When timeout=0, script runs indefinitely until complete
- [ ] Stop button still works to cancel execution
- [ ] UI shows "(no timeout)" when timeout=0
- [ ] Setting persists across app restarts

## Edge Cases
- [ ] Handles corrupted settings (invalid timeout value)
- [ ] Works with existing timeouts (migration path)
- [ ] Stop button terminates even with no timeout

## API Contract
\`\`\`typescript
interface ExecutionOptions {
  timeout?: number; // 0 = disabled, >0 = milliseconds
}
\`\`\`

## Related
- Depends on: #30 (execution timing)
- Enables: #32 (long-running examples)
```

**c) For Complex Features: Create Spec Document**

```bash
# Create specs directory if it doesn't exist
mkdir -p specs

# Write detailed spec
cat > specs/execution-timeout-control.md << 'EOF'
# Execution Timeout Control

## Overview
Allow users to configure or disable execution timeouts for long-running scripts.

## User Stories
1. As a data scientist, I want to disable timeouts so my data processing completes
2. As a learner, I want quick timeouts (5s) so I don't wait for infinite loops

## Requirements
### Functional
- FR-1: Settings UI allows timeout configuration (0, 5s-300s)
- FR-2: Timeout=0 means "run indefinitely"
- FR-3: Stop button always works regardless of timeout
- FR-4: Current timeout displayed during execution

### Non-Functional
- NFR-1: Setting persists in localStorage
- NFR-2: Default timeout remains 30s
- NFR-3: UI clearly indicates "no timeout" state

## API Design
\`\`\`typescript
// Executor interface
interface CodeExecutor {
  execute(code: string, options: ExecutionOptions): Promise<ExecutionResult>;
  stop(): void; // Always available
}

interface ExecutionOptions {
  timeout?: number; // 0=disabled, undefined=default (30000), >0=milliseconds
}
\`\`\`

## UI Changes
- Settings > Execution tab: Timeout input field
  - Label: "Execution Timeout (0 = disabled)"
  - Input: Number, min=0, max=300000, step=5000
  - Help text: "Set to 0 to disable timeout and run indefinitely"

## Test Cases
| Test ID | Scenario | Expected Result |
|---------|----------|----------------|
| TC-1 | timeout=30000, simple code | Completes in <30s |
| TC-2 | timeout=0, infinite loop + Stop | Stops when user clicks |
| TC-3 | timeout=5000, 10s script | Times out at 5s |
| TC-4 | Restart app | Timeout setting restored |

## Implementation Plan
1. Update ExecutionOptions interface
2. Modify CSharpExecutor.execute() to handle timeout=0
3. Update Settings modal UI
4. Add localStorage persistence
5. Write E2E tests (4 tests)
6. Update documentation

## Acceptance
- [ ] All test cases pass
- [ ] E2E tests added and passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] No regressions in existing tests
EOF
```

#### 2. **Test-Driven Development** (Write Tests First)

**Before writing implementation**, write tests that expect the behavior:

```typescript
// tests/e2e/execution-timeout.spec.ts
import { test, expect } from '@playwright/test';
import { launchApp, closeApp, typeInEditor, clickRun, waitForExecutionComplete } from './helpers/electron';

test.describe('Execution Timeout Control', () => {
  test('should allow timeout to be set to 0 (disabled)', async () => {
    const { app, window } = await launchApp();
    
    try {
      // Open settings
      await window.locator('button[title*="Settings"]').click();
      
      // Navigate to Execution tab
      await window.locator('text=Execution').click();
      
      // Set timeout to 0
      const timeoutInput = window.locator('input[type="number"]').first();
      await timeoutInput.fill('0');
      
      // Save settings
      await window.locator('button:has-text("Save")').click();
      
      // Verify setting saved (modal closes)
      await window.locator('.ant-modal').waitFor({ state: 'hidden' });
    } finally {
      await closeApp(app);
    }
  });

  test('should run indefinitely when timeout=0', async () => {
    const { app, window } = await launchApp();
    
    try {
      // TODO: Set timeout to 0 in settings first
      
      // Type infinite loop with output
      const code = `for (int i = 0; i < 100; i++) {
        Console.WriteLine($"Iteration {i}");
        System.Threading.Thread.Sleep(100);
      }`;
      
      await typeInEditor(window, code);
      await clickRun(window);
      
      // Wait longer than default timeout (30s) - should still be running
      await window.waitForTimeout(35000);
      
      // Verify still running (Stop button visible)
      await expect(window.locator('button:has-text("Stop")')).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });
});
```

**Tests should fail initially** - that's expected! They define what success looks like.

#### 3. **Implementation Phase**

Now implement to make the tests pass:

```typescript
// src/backend/executors/csharp.ts
export interface ExecutionOptions {
  timeout?: number; // 0 = disabled, undefined = default (30000), >0 = milliseconds
}

async execute(code: string, options: ExecutionOptions = {}) {
  const timeout = options.timeout ?? 30000; // Default to 30s
  
  if (timeout === 0) {
    // No timeout - run indefinitely
    // Don't set up timeout timer
  } else {
    // Set up timeout
    setTimeout(() => {
      // Kill process
    }, timeout);
  }
}
```

**Implementation Rules**:
- ✅ Implement only what's in the spec
- ✅ Make tests pass one by one
- ✅ Refactor for clarity after tests pass
- ❌ Don't add features not in the spec ("gold plating")
- ❌ Don't skip edge cases defined in spec

#### 4. **Verification Phase**

**Before closing the issue**:
- [ ] All automated tests pass
- [ ] Manual testing confirms UX
- [ ] Documentation updated (if user-facing)
- [ ] Code reviewed (or self-reviewed against spec)
- [ ] No regressions (existing tests still pass)

```bash
# Run tests
npm test              # Unit tests
npm run test:e2e      # E2E tests
npm run lint          # Linting
npm run typecheck     # Type checking

# Manual testing
npm run electron:dev
# Test the feature interactively
```

#### 5. **Completion**

```bash
# Commit with issue reference
git add -A
git commit -m "feat: Add configurable execution timeout (#31)

Implements spec in issue #31 for disabling execution timeout.

Changes:
- Allow timeout=0 in ExecutionOptions (means disabled)
- Update Settings modal with timeout input field
- Add E2E tests for timeout control
- Persist timeout setting in localStorage

Fixes #31"

# Close issue
gh issue close 31 --comment "Implemented in commit $(git rev-parse HEAD)"
```

---

## Spec Templates

### GitHub Issue Template (Simple Features)

```markdown
## User Story
As a [role], I want [feature] so that [benefit].

## Acceptance Criteria
- [ ] Criterion 1 (testable)
- [ ] Criterion 2 (testable)
- [ ] Criterion 3 (testable)

## Edge Cases
- [ ] Edge case 1
- [ ] Edge case 2

## API/Interface (if applicable)
\`\`\`typescript
interface Foo {
  bar: string;
}
\`\`\`

## UI Changes (if applicable)
- Button added to toolbar
- Modal displays settings form
- Error message shows on validation failure

## Related
- Depends on: #XX
- Blocks: #YY
- Related: #ZZ
```

### Feature Spec Document Template (Complex Features)

```markdown
# Feature Name

## Overview
Brief description of what this feature does and why it exists.

## User Stories
1. As a [role], I want [feature] so that [benefit]
2. As a [role], I want [feature] so that [benefit]

## Requirements

### Functional Requirements
- FR-1: System shall do X
- FR-2: User can do Y
- FR-3: Feature handles Z

### Non-Functional Requirements
- NFR-1: Performance requirement
- NFR-2: Security requirement
- NFR-3: Usability requirement

## API/Interface Design
\`\`\`typescript
// Complete type definitions
interface Feature {
  method(param: Type): ReturnType;
}
\`\`\`

## UI/UX Design
- Wireframes, mockups, or detailed descriptions
- User interaction flows
- Error states and messages

## Data Model
- Database schema changes
- Data structures
- Migration requirements

## Test Cases
| ID | Scenario | Input | Expected Output |
|----|----------|-------|-----------------|
| TC-1 | Happy path | Valid input | Success |
| TC-2 | Error case | Invalid input | Error message |
| TC-3 | Edge case | Boundary value | Handles gracefully |

## Implementation Plan
1. Step 1: Task description
2. Step 2: Task description
3. Step 3: Task description

## Dependencies
- Requires: Feature X
- Blocks: Feature Y
- Related: Feature Z

## Acceptance Criteria
- [ ] All test cases pass
- [ ] E2E tests written and passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] No performance regressions
- [ ] Accessible (keyboard navigation, screen readers)

## Out of Scope
- Feature A (deferred to Phase 2)
- Feature B (won't implement)

## Open Questions
- Question 1?
- Question 2?
```

---

## GitHub Issue Workflow

### Creating Issues

**ALWAYS create an issue before starting work** (except trivial typos).

```bash
# Create enhancement
gh issue create --title "feat: Add keyboard shortcut for clear output" \
                --label enhancement \
                --milestone "v0.2.0"

# Create bug report
gh issue create --title "bug: Window position not saved on Linux" \
                --label bug \
                --milestone "v0.1.0 - Pre-Release"

# Create documentation task
gh issue create --title "docs: Document .Dump() usage patterns" \
                --label documentation \
                --milestone "v0.1.0 - Pre-Release"
```

**Issue Labels**:
- `enhancement` - New feature or improvement
- `bug` - Something isn't working
- `documentation` - Documentation updates
- `testing` - Test additions or fixes
- `refactor` - Code cleanup or reorganization
- `performance` - Performance improvements
- `security` - Security issues

**Issue Milestones**:
- `v0.1.0 - Pre-Release` - Current release
- `Phase 2` - Multi-language, NuGet, rich output
- `Phase 3` - Database connectivity
- `Phase 4` - Cloud sync
- `Backlog` - Future considerations

### During Work

**Commit Message Format**:
```
<type>: <description> (#issue-number)

<optional body>

<optional footer>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Types**:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test additions/changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Build/tooling changes

**Examples**:
```bash
git commit -m "feat: Add Stop button for execution cancellation (#32)

Allows users to immediately terminate long-running scripts.

- Add stop() method to CSharpExecutor
- Add stopExecution IPC handler
- Replace Run button with Stop during execution
- Update E2E tests

Fixes #32"
```

### Closing Issues

```bash
# Close when complete
gh issue close 32 --comment "Implemented in commit abc123. Stop button now cancels execution immediately."

# Close as duplicate
gh issue close 40 --comment "Duplicate of #32" --reason "not planned"

# Close as won't fix
gh issue close 41 --comment "Out of scope for v0.1.0, deferred to Phase 2" --reason "not planned"
```

---

## Documentation and Wiki Workflow

### Repository Root Files (Only These)

- ✅ `README.md` - Project overview, quick start, features
- ✅ `CHANGELOG.md` - Release history
- ✅ `CONTRIBUTING.md` - Contribution guidelines
- ✅ `CLAUDE.md` - AI assistant guidance (this file)
- ✅ `LICENSE` - License file
- ✅ `PROJECT-PLAN.md` - High-level roadmap
- ✅ `RELEASE_NOTES_v*.md` - Release notes for specific versions

### Wiki Documentation (Everything Else)

**Wiki URL**: https://github.com/treytomes/code-pad/wiki

**Content Types**:
- Setup guides (Windows, Linux, macOS, WSL)
- Architecture and design documents
- Feature specifications (for complex features)
- API documentation
- Troubleshooting guides
- Developer guides
- Historical/archived documents

**Adding to Wiki**:
```bash
# Clone wiki
git clone git@github.com:treytomes/code-pad.wiki.git /tmp/code-pad-wiki
cd /tmp/code-pad-wiki

# Create page (use Title-Case-With-Hyphens.md)
cat > Feature-Name-Guide.md << 'EOF'
# Feature Name Guide

## Overview
...

## Usage
...

## Examples
...
EOF

# Commit and push
git add .
git commit -m "Add guide for feature name"
git push
```

**Naming Convention**:
- `Title-Case-With-Hyphens.md`
- Examples: `Windows-Setup.md`, `Architecture-Overview.md`, `Troubleshooting-WSL.md`

---

## Testing Requirements

### Test Coverage Targets

- **Backend modules**: 80%+ coverage
- **React components**: 70%+ coverage
- **Utilities/helpers**: 90%+ coverage

### Test Types

1. **Unit Tests** (Vitest)
   - Pure logic, no side effects
   - Backend executors, utilities
   - Run with: `npm test`

2. **Integration Tests** (Vitest)
   - Database operations
   - IPC communication
   - File system operations

3. **E2E Tests** (Playwright + Electron)
   - Full user workflows
   - UI interactions
   - Run with: `npm run test:e2e` (builds first)

### Test-Driven Development (TDD)

**Write tests BEFORE implementation**:

```typescript
// 1. Write test that expects the behavior
test('should execute code with timeout=0', async () => {
  const result = await executor.execute(code, { timeout: 0 });
  // This will fail initially - that's expected!
});

// 2. Run test (it fails)
npm test

// 3. Implement feature to make test pass
// ... write code ...

// 4. Run test again (it passes)
npm test

// 5. Refactor if needed (tests still pass)
```

### Test Structure

```typescript
describe('FeatureName', () => {
  // Setup
  beforeEach(() => {
    // Initialize test environment
  });

  afterEach(() => {
    // Cleanup
  });

  describe('happyPath', () => {
    it('should handle valid input correctly', () => {
      // Test expected behavior
    });
  });

  describe('edgeCases', () => {
    it('should handle empty input', () => {});
    it('should handle null/undefined', () => {});
    it('should handle boundary values', () => {});
  });

  describe('errorHandling', () => {
    it('should throw on invalid input', () => {});
    it('should log errors appropriately', () => {});
  });
});
```

### Running Tests

```bash
# All unit tests
npm test

# Specific test file
npm test -- filename.test.ts

# Watch mode
npm test -- --watch

# Coverage report
npm run test:coverage

# E2E tests (builds first)
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# All tests (unit + E2E)
npm run test:all
```

---

## Code Quality Standards

### TypeScript

- **Strict mode enabled**
- **No `any` types** (use `unknown` and type guards)
- **Explicit return types** for public functions
- **Interfaces over types** for objects
- **Const assertions** for literal types

### Formatting

- **Prettier** for consistent formatting
- **2-space indentation**
- **Semicolons**
- **Single quotes**
- **Trailing commas** in multiline

### Linting

```bash
# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Check formatting
npm run format:check

# Format all files
npm run format
```

### Pre-commit Checks

Husky + lint-staged runs automatically:
- ESLint on staged TypeScript files
- Prettier formatting on staged files
- Tests must pass (configured in CI)

---

## Security Best Practices

### Electron Security

- ✅ **Context isolation enabled**
- ✅ **Node integration disabled** in renderer
- ✅ **Sandbox enabled** for renderer process
- ✅ **Preload script** uses context bridge only
- ✅ **No remote module** usage
- ✅ **IPC validation** on all handlers

### Code Execution

- ✅ **Sandboxed execution** (spawned processes)
- ✅ **Timeout enforcement** (configurable)
- ✅ **Stop button** for manual termination
- ✅ **Temp file cleanup** after execution
- ✅ **Process isolation** (no shared state)

### Data Storage

- ✅ **SQLite transactions** for data integrity
- ✅ **Input validation** on all user data
- ✅ **Prepared statements** (no SQL injection)
- ✅ **Settings validation** on load

---

## Project Board & Milestones

**Project Board**: https://github.com/users/treytomes/projects/2 (Public)

**Columns**:
- **Todo** - Not started
- **In Progress** - Currently being worked on
- **Review** - Awaiting review/testing
- **Done** - Completed

**Milestones**:
- **v0.1.0 - Pre-Release** - Current release (C# only, core features)
- **Phase 2** - Multi-language, NuGet, rich output
- **Phase 3** - Database connectivity, plugins
- **Phase 4** - Cloud sync, collaboration

**Issue Tracking**:
```bash
# List open issues for current milestone
gh issue list --milestone "v0.1.0 - Pre-Release" --state open

# List all issues
gh issue list

# View specific issue
gh issue view 42

# Update issue milestone
gh issue edit 42 --milestone "Phase 2"

# Add labels
gh issue edit 42 --add-label "enhancement,testing"
```

---

## Development Commands

### Build

```bash
# Full build
npm run build

# Main process only (TypeScript → CommonJS)
npm run build:main

# Renderer only (Vite → ESM bundle)
npm run build:renderer

# Production build (clean + build + package)
npm run build:prod
```

### Development

```bash
# Start dev server (renderer only)
npm run dev

# Build and run Electron app
npm run electron:dev

# Start app (assumes already built)
npm start
```

### Testing

```bash
# Unit tests
npm test

# Unit tests (watch mode)
npm run test:watch

# Unit tests with coverage
npm run test:coverage

# E2E tests (builds first)
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# All tests
npm run test:all
```

### Quality Checks

```bash
# Lint
npm run lint

# Lint with auto-fix
npm run lint:fix

# Type check (no emit)
npm run typecheck

# Format check
npm run format:check

# Format all files
npm run format
```

### Utilities

```bash
# Clean build artifacts
npm run clean

# View logs (WSL/Linux)
npm run logs

# View logs (Windows)
npm run logs:windows

# Clear logs (WSL/Linux)
npm run logs:clear

# Clear logs (Windows)
npm run logs:clear:windows
```

---

## AI Assistant Guidelines

### For Claude Code Resuming Work

1. **Read GitHub Issues**: Check open issues in current milestone
2. **Check CI Status**: Review latest GitHub Actions runs
3. **Review Recent Commits**: `git log --oneline -10`
4. **Check Project Board**: See what's in progress
5. **Follow Spec-Driven Process**: 
   - Read spec/issue FIRST
   - Write tests BEFORE implementation
   - Implement to make tests pass
   - Verify against acceptance criteria

### For New Features

1. **Create GitHub issue with spec** (or read existing issue)
2. **Write tests that expect the behavior** (TDD)
3. **Implement to make tests pass**
4. **Verify acceptance criteria met**
5. **Update documentation** if user-facing
6. **Close issue** with commit reference

### For Bug Fixes

1. **Create or read bug issue** with reproduction steps
2. **Write failing test** that reproduces the bug
3. **Fix the bug** (test now passes)
4. **Verify fix** doesn't break existing tests
5. **Close issue** with fix details

### For Refactoring

1. **Ensure tests exist** for the code being refactored
2. **Run tests** (all pass before refactoring)
3. **Refactor code**
4. **Run tests again** (all still pass)
5. **Commit** with clear rationale for refactoring

### Quality Checklist Before Committing

- [ ] All tests pass (`npm run test:all`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Code formatted (`npm run format`)
- [ ] Commit message follows convention
- [ ] Issue referenced in commit message
- [ ] Acceptance criteria met (if implementing spec)

---

## Repository Information

**URL**: https://github.com/treytomes/code-pad  
**Issues**: https://github.com/treytomes/code-pad/issues  
**Wiki**: https://github.com/treytomes/code-pad/wiki  
**Project Board**: https://github.com/users/treytomes/projects/2  
**License**: MIT

**Current Branch**: main  
**Current Version**: v0.1.0-pre  
**Status**: 🟢 Ready for release build and testing

---

**Last Updated**: 2026-05-02  
**Project Status**: v0.1.0 Pre-Release - Ready for Production Build  
**Next Steps**: Build production packages, final testing, tag release
