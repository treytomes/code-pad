# Patterns to Follow

Code patterns and conventions established for CodePad.

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

### Inline Styles (Current Approach)
```typescript
// Use for component-specific styles
<div
  style={{
    padding: '8px',
    background: '#252526',
    color: '#cccccc',
  }}
>
  Content
</div>
```

### Color Palette (VS Code Dark Theme)
```typescript
// Backgrounds
background: '#1e1e1e'    // Main background
background: '#252526'    // Sidebar background
background: '#2d2d30'    // Border color

// Text
color: '#cccccc'         // Normal text
color: '#858585'         // Secondary text
color: '#ffffff'         // Emphasis

// Accent colors
color: '#4ec9b0'         // Cyan (keywords, types)
color: '#569cd6'         // Blue (functions)
color: '#ce9178'         // Orange (strings)
color: '#b5cea8'         // Green (numbers)
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

---

**Last Updated**: 2026-05-02
**Review**: Update when establishing new patterns
