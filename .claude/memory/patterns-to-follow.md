# Patterns to Follow

Code patterns, conventions, and development workflows established for CodePad.

## Development Workflow: Spec-Driven Development

### Core Principle
**Write specifications BEFORE implementation code.**

### New Feature Workflow

1. **Specification Phase** (Do This First!)
   - Create GitHub Issue with acceptance criteria
   - For complex features: Write detailed spec in `specs/` directory
   - Define TypeScript interfaces/contracts
   - Write test stubs that expect the behavior

2. **Test-Driven Development**
   - Write tests BEFORE implementing
   - Tests should fail initially (red)
   - Implement to make tests pass (green)
   - Refactor for clarity (refactor)

3. **Implementation Phase**
   - Implement only what's in the spec
   - Make tests pass one by one
   - Don't add features not in spec

4. **Verification Phase**
   - All tests pass
   - Manual testing confirms UX
   - Documentation updated
   - No regressions

5. **Completion**
   - Commit with issue reference
   - Close issue with commit hash

### Example: Timeout Control Feature

**Step 1: Specification (GitHub Issue)**
```markdown
## User Story
As a developer running long scripts, I want to disable the timeout
so that my script can run until completion.

## Acceptance Criteria
- [ ] Settings modal accepts timeout=0 (disabled)
- [ ] When timeout=0, script runs indefinitely
- [ ] Stop button still works
- [ ] Setting persists across restarts

## API Contract
\`\`\`typescript
interface ExecutionOptions {
  timeout?: number; // 0 = disabled
}
\`\`\`
```

**Step 2: Write Test First (TDD)**
```typescript
test('should run indefinitely when timeout=0', async () => {
  const result = await executor.execute(code, { timeout: 0 });
  // Test fails initially - implement to make it pass
});
```

**Step 3: Implement**
```typescript
async execute(code: string, options: ExecutionOptions = {}) {
  const timeout = options.timeout ?? 30000;
  if (timeout === 0) {
    // Run indefinitely
  } else {
    // Set timeout
  }
}
```

**Step 4: Verify & Close**
```bash
npm test  # All tests pass
git commit -m "feat: Add configurable timeout (#31)"
gh issue close 31
```

## Naming Conventions

### Components
- **Files**: PascalCase with `.tsx` extension
  - `SnippetList.tsx`, `CodeEditor.tsx`, `OutputDisplay.tsx`
- **Component Names**: Match file name
  - `export const SnippetList: React.FC<SnippetListProps> = ({ ... }) => { ... }`
- **Props Interface**: ComponentName + "Props"
  - `interface SnippetListProps { ... }`

### Backend Modules
- **Files**: camelCase with `.ts` extension
  - `database.ts`, `csharp.ts`, `output-formatter.ts`
- **Classes**: PascalCase
  - `class SnippetDatabase`, `class CSharpExecutor`
- **Functions**: camelCase
  - `function formatJSON()`, `function detectOutputFormat()`

### Constants
- **Global Constants**: UPPER_SNAKE_CASE
  - `const DEFAULT_TIMEOUT = 30000;`
  - `const SAMPLE_CATEGORIES = ['Getting Started', ...];`

## File Organization

### Component Structure
```typescript
// 1. Imports (React, external libs, internal modules)
import React, { useState, useEffect } from 'react';
import { Button, List } from 'antd';
import type { Snippet } from '../../../backend/database';

// 2. Type definitions
interface MyComponentProps {
  onAction: (id: string) => void;
}

// 3. Component definition
export const MyComponent: React.FC<MyComponentProps> = ({ onAction }) => {
  // 3a. State declarations
  const [data, setData] = useState<Type>([]);
  
  // 3b. Effects
  useEffect(() => { ... }, [deps]);
  
  // 3c. Event handlers
  const handleClick = () => { ... };
  
  // 3d. Render helpers
  const renderItem = (item: Type) => { ... };
  
  // 3e. Return JSX
  return <div>...</div>;
};
```

### Backend Module Structure
```typescript
// 1. Imports
import * as fs from 'fs';
import * as path from 'path';

// 2. Types/Interfaces
export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

// 3. Constants
const DEFAULT_TIMEOUT = 30000;

// 4. Class or functions
export class Executor {
  // Private fields first
  private timeout: number;
  
  // Constructor
  constructor() { ... }
  
  // Public methods
  public execute() { ... }
  
  // Private methods
  private compile() { ... }
}
```

## Error Handling

### Try-Catch Pattern
```typescript
// Always catch specific errors
try {
  const result = await window.electronAPI.execute(code);
  // Handle success
} catch (error) {
  console.error('Failed to execute code:', error);
  // Show user-friendly message
  message.error('Failed to execute code');
  // Optional: Log to file
  window.electronAPI.logger?.error('Execution failed', error);
}
```

### IPC Error Handling
```typescript
// Main process: Return error in result object
electron.ipcMain.handle('execute-code', async (event, code) => {
  try {
    return await executor.execute(code);
  } catch (error) {
    return {
      stdout: '',
      stderr: error.message,
      exitCode: -1,
      error: error.message,
    };
  }
});

// Renderer: Check result for errors
const result = await window.electronAPI.executeCode(code);
if (result.exitCode !== 0) {
  // Handle error
}
```

## State Management

### useState Pattern
```typescript
// Initialize with proper type
const [snippets, setSnippets] = useState<Snippet[]>([]);

// Update immutably
setSnippets(prev => [...prev, newSnippet]); // Add
setSnippets(prev => prev.filter(s => s.id !== id)); // Remove
setSnippets(prev => prev.map(s => s.id === id ? updated : s)); // Update
```

### useEffect Dependencies
```typescript
// Always specify dependencies
useEffect(() => {
  loadData();
}, [languageFilter, searchText]); // Re-run when these change

// Empty deps = run once on mount
useEffect(() => {
  initialize();
}, []);

// No deps array = run on every render (usually wrong!)
// useEffect(() => { ... }); // ❌ Avoid
```

## IPC Communication

### Channel Naming
- **Pattern**: `verb-noun` or `noun-verb`
  - Good: `execute-code`, `db-create-snippet`, `menu-new-snippet`
  - Bad: `executeCode`, `create`, `doThing`

### Handler Registration
```typescript
// Main process
electron.ipcMain.handle('execute-code', async (event, code: string) => {
  // Return value sent back to renderer
  return await executor.execute(code);
});

// Renderer invocation
const result = await window.electronAPI.executeCode(code);
```

### Event Streaming
```typescript
// Main process: Send events
event.sender.send('execution-output-chunk', { chunk, isError });

// Renderer: Listen for events
const cleanup = window.electronAPI.onOutputChunk((chunk, isError) => {
  setOutput(prev => prev + chunk);
});

// Don't forget cleanup!
return () => cleanup();
```

## Database Patterns

### CRUD Operations
```typescript
// Create
const snippet = await db.createSnippet({ name, language, code });

// Read
const snippet = await db.getSnippet(id);
const snippets = await db.listSnippets(languageFilter);

// Update
await db.updateSnippet(id, { code: newCode });

// Delete
await db.deleteSnippet(id);
```

### Transaction Pattern (future)
```typescript
// Wrap related operations in transaction
db.transaction(() => {
  db.createSnippet(snippet1);
  db.createSnippet(snippet2);
  db.updateMetadata(meta);
});
```

## Testing Patterns

### Component Tests
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render with initial state', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Backend Tests
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('CSharpExecutor', () => {
  let executor: CSharpExecutor;

  beforeEach(() => {
    executor = new CSharpExecutor();
  });

  afterEach(() => {
    // Cleanup
  });

  it('should execute valid code', async () => {
    const result = await executor.execute('Console.WriteLine("test");');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('test');
  });

  it('should handle compilation errors', async () => {
    const result = await executor.execute('invalid code!!!');
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toBeTruthy();
  });
});
```

## Styling Patterns

### Theming via ConfigProvider
The app supports dark/light/system themes. `ConfigProvider` is owned by `App` and switches Ant Design token sets at runtime. **Do not hardcode dark-specific hex colors** in new components — derive from theme context or use neutral values that work in both themes.

```typescript
// App.tsx computes these from current theme:
const isDark = resolveTheme(appTheme) === 'dark';
const bgMain   = isDark ? '#1e1e1e' : '#f5f5f5';
const bgHeader = isDark ? '#323233' : '#ffffff';
const bgSider  = isDark ? '#252526' : '#fafafa';
const borderColor = isDark ? '#2d2d30' : '#d9d9d9';
const monacoTheme = isDark ? 'vs-dark' : 'light'; // passed to CodeEditor
```

New components should either receive theme-derived values as props, or use Ant Design tokens via `theme.useToken()`.

### Color Reference (VS Code Dark Theme)
These are used in dark mode and fixed UI elements (e.g., the blue status bar):
```typescript
// Status bar (always blue, theme-independent)
background: '#007acc'

// Dark-mode backgrounds
background: '#1e1e1e'    // Main background
background: '#252526'    // Sidebar background
background: '#2d2d30'    // Border color

// Dark-mode text
color: '#cccccc'         // Normal text
color: '#858585'         // Secondary text

// Accent colors (both themes)
color: '#4ec9b0'         // Cyan (output label, executing dot)
color: '#569cd6'         // Blue (primary actions)
color: '#ce9178'         // Orange (strings)
color: '#ffc107'         // Yellow (starred)
color: '#f48771'         // Red (errors)
```

## Performance Patterns

### Debouncing
```typescript
// Debounce frequent operations
let timeout: NodeJS.Timeout | null = null;
const debouncedSave = () => {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => {
    saveState();
  }, 500);
};
```

### Memoization
```typescript
// Use useMemo for expensive computations
const filteredData = useMemo(() => {
  return data.filter(item => item.name.includes(searchText));
}, [data, searchText]);

// Use useCallback for stable function references
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

## Anti-Patterns to Avoid

### ❌ Don't Modify State Directly
```typescript
// Bad
snippets.push(newSnippet);
setSnippets(snippets);

// Good
setSnippets([...snippets, newSnippet]);
```

### ❌ Don't Forget Cleanup
```typescript
// Bad
useEffect(() => {
  const interval = setInterval(() => { ... }, 1000);
  // Forgot to clear interval!
});

// Good
useEffect(() => {
  const interval = setInterval(() => { ... }, 1000);
  return () => clearInterval(interval);
}, []);
```

### ❌ Don't Use Any Type
```typescript
// Bad
const data: any = getData();

// Good
interface Data { ... }
const data: Data = getData();
```

### ❌ Don't Ignore Errors
```typescript
// Bad
try {
  await operation();
} catch (e) {
  // Silent failure
}

// Good
try {
  await operation();
} catch (error) {
  console.error('Operation failed:', error);
  message.error('Failed to complete operation');
}
```

## Output Formatting Patterns

### UTF-8 and Unicode
All C# code (Statement, Expression, Program modes) automatically has UTF-8 encoding configured via Module Initializer. Emojis and Unicode characters work correctly:

```csharp
Console.WriteLine("✅ Success");
Console.WriteLine("🚀 Launching...");
Console.WriteLine("╔═══╗ Box drawing works");
```

### ANSI Color Codes (Recommended)
Use ANSI escape sequences instead of `Console.ForegroundColor` for best UTF-8 compatibility:

```csharp
// Create a helper class
public static class AnsiColors
{
    public const string Red = "\x1b[31m";
    public const string Green = "\x1b[32m";
    public const string Yellow = "\x1b[33m";
    public const string Reset = "\x1b[0m";
}

// Use inline
Console.WriteLine($"{AnsiColors.Green}✅ Test passed{AnsiColors.Reset}");
```

**Why not Console.ForegroundColor?**
- Windows Console API can break UTF-8 encoding
- ANSI codes work consistently across all platforms
- CodePad's ANSI renderer handles them perfectly

### Labeled Sections
Use triple equals for section headers:

```csharp
Console.WriteLine("=== Test Results ===");
Console.WriteLine("All tests passed");
```

Renders with teal/cyan label styling, separated from content.

### Horizontal Rules
Create visual separators using Markdown syntax:

```csharp
Console.WriteLine("Section 1");
Console.WriteLine("---");  // or ___ or ***
Console.WriteLine("Section 2");
```

Renders as a styled horizontal divider.

### Structured Data
Use `.Dump()` for automatic formatting:

```csharp
// Arrays become tables
var data = new[] { 
    new { Name = "Alice", Age = 30 },
    new { Name = "Bob", Age = 25 }
};
data.Dump("User Data");  // Table with label

// Objects become JSON trees
var result = new { Status = "OK", Count = 42 };
result.Dump();  // Expandable JSON tree
```

### Rich Output Template
Combine all features for professional output:

```csharp
Console.WriteLine("=== Integration Test Results ===");
Console.WriteLine();

Console.WriteLine($"{AnsiColors.Cyan}🕒 Started: {DateTime.Now}{AnsiColors.Reset}");
Console.WriteLine("---");

// Test 1
Console.WriteLine($"Test 1: {AnsiColors.Green}✅ PASSED{AnsiColors.Reset}");

// Test 2
Console.WriteLine($"Test 2: {AnsiColors.Red}❌ FAILED{AnsiColors.Reset}");

Console.WriteLine("---");

// Summary
var summary = new { Passed = 1, Failed = 1, Total = 2 };
summary.Dump("Summary");
```

### Async/Await Support
Statement and Expression modes support async/await with async Main:

```csharp
// Statements mode - await works directly
await Task.Delay(100);
Console.WriteLine("Async completed");

// Async method calls with .Dump()
var result = await FetchDataAsync().Dump("API Response");

// Task<T>.Dump() awaits internally - cleaner syntax
await QueryAsync("param").Dump("Query Result");  // Recommended
(await QueryAsync("param")).Dump("Query Result");  // Also works but verbose
```

**Key Points**:
- Statement and Expression modes have `async Task Main()` wrapper
- Use `await` directly in Statements mode (no need for Program mode)
- `.Dump()` has `Task<T>` overload that awaits internally
- Prevents serialization errors when dumping unawaited tasks

---

**Last Updated**: 2026-05-08
**Review**: Update when establishing new patterns
