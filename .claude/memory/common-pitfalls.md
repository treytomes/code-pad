# Common Pitfalls

Known issues and gotchas to avoid when working on CodePad.

## Build Issues

### ❌ better-sqlite3 Requires C++17
**Problem**: Latest better-sqlite3 requires C++20, but AlmaLinux 8 only has GCC 8.5 (C++17)

**Solution**: Use better-sqlite3 v9.6.0 (specified in package.json)

**Command**:
```bash
export PYTHON="$(pwd)/venv/bin/python"
npm install
```

**Why**: Python 3.11 venv needed for native module compilation

### ❌ Electron GUI Doesn't Work in WSL
**Problem**: Electron module loading broken in WSL (exports return undefined)

**Solution**: 
- Backend development: Use WSL (no GUI needed)
- GUI testing: Use Windows

**Documented**: See wiki page "Electron-WSL-Issue"

### ❌ CS1109: Extension Methods in Nested Class
**Problem**: dotnet-script wraps .csx files in implicit class, making extension methods nested

**Solution**: Switched to full dotnet build with Program.Main() wrapper

**Implementation**: User code wrapped in `static void Main()`, DumpExtensions as top-level class

## TypeScript Issues

### ❌ Template Literal in String Causes Parse Error
**Problem**: C# interpolated strings like `$"Price: ${price}"` parsed as TypeScript template

**Solution**: Escape dollar sign or use concatenation
```typescript
// Bad
code: `Console.WriteLine($"Price: ${price}");`

// Good
code: `Console.WriteLine("Price: $" + price);`
```

### ❌ Module Format Mismatch
**Problem**: Electron main needs CommonJS, renderer needs ESM

**Solution**: Two tsconfig files
- `tsconfig.main.json`: `"module": "commonjs"`
- `tsconfig.json`: `"module": "esnext"`

**Important**: NO `"type": "module"` in package.json

## React Patterns

### ❌ Missing useEffect Dependencies
**Problem**: ESLint warns about missing deps, causes stale closures

**Solution**: Always include all dependencies
```typescript
// Bad
useEffect(() => {
  doSomething(value);
}, []); // 'value' should be in deps

// Good
useEffect(() => {
  doSomething(value);
}, [value]);
```

### ❌ State Updates Not Batched
**Problem**: Multiple setState calls may not batch in event handlers

**Solution**: Use functional updates
```typescript
// Bad
setCount(count + 1);
setCount(count + 1); // Still count + 1, not count + 2

// Good
setCount(c => c + 1);
setCount(c => c + 1); // Correctly becomes count + 2
```

### ❌ Forgetting to Prevent Propagation
**Problem**: Click events bubble up, triggering parent handlers

**Solution**: stopPropagation when needed
```typescript
<Button
  onClick={(e) => {
    e.stopPropagation(); // Don't trigger parent list item click
    handleDelete(id);
  }}
/>
```

## IPC Communication

### ❌ Not Cleaning Up Event Listeners
**Problem**: Event listeners accumulate, causing memory leaks

**Solution**: Always return cleanup function
```typescript
useEffect(() => {
  const cleanup = window.electronAPI.onOutputChunk((chunk) => {
    setOutput(prev => prev + chunk);
  });
  
  return cleanup; // Clean up on unmount!
}, []);
```

### ❌ Synchronous IPC in Renderer
**Problem**: IPC is always async, can't use ipcRenderer.sendSync

**Solution**: Use handle/invoke pattern
```typescript
// Main
ipcMain.handle('get-data', async () => {
  return await fetchData();
});

// Renderer
const data = await window.electronAPI.getData();
```

## Database Issues

### ❌ Not Handling Database Lock
**Problem**: SQLite locks database during write operations

**Solution**: Use better-sqlite3's synchronous API, handle SQLITE_BUSY
```typescript
try {
  db.prepare('INSERT ...').run();
} catch (error) {
  if (error.code === 'SQLITE_BUSY') {
    // Retry or handle gracefully
  }
}
```

### ❌ SQL Injection via String Concatenation
**Problem**: User input in SQL strings enables injection

**Solution**: Always use prepared statements
```typescript
// Bad
db.exec(`SELECT * FROM snippets WHERE name = '${userInput}'`);

// Good
const stmt = db.prepare('SELECT * FROM snippets WHERE name = ?');
stmt.get(userInput);
```

## C# Execution

### ❌ Using Statements After Auto-Flush Code
**Problem**: Auto-flush console writes executable code, using must come first

**Solution**: Don't include using in injected code, use fully-qualified names
```typescript
// Bad
injectedCode = `
  using System;
  Console.SetOut(new AutoFlushWriter(...));
`;

// Good (no using, use System.Console)
injectedCode = `
  System.Console.SetOut(new AutoFlushWriter(...));
`;
```

### ❌ Not Handling Circular References
**Problem**: JSON serialization fails on circular object graphs

**Solution**: Use ReferenceHandler.IgnoreCycles
```csharp
var options = new JsonSerializerOptions {
    ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles
};
```

### ❌ Timeout Not Working
**Problem**: Long-running C# code doesn't respect timeout

**Solution**: Kill process after timeout
```typescript
const timeout = setTimeout(() => {
  process.kill('SIGTERM');
}, timeoutMs);
```

## Git Workflow

### ❌ Committing Without Issue Number
**Problem**: Hard to track which commit relates to which work

**Solution**: Always reference issue in commit
```bash
# Bad
git commit -m "feat: Add feature"

# Good
git commit -m "feat: Add feature (#30)"
```

### ❌ Amending After Hook Failure
**Problem**: If pre-commit hook fails, --amend modifies WRONG commit

**Solution**: Create NEW commit after fixing
```bash
# Bad (after hook failure)
git commit --amend

# Good
git add .
git commit -m "fix: Address linting issues from previous commit"
```

## Testing

### ❌ Replacing the window Object in jsdom Tests
**Problem**: `(global as any).window = { electronAPI: mock }` replaces the entire jsdom window, wiping `clearTimeout`, `addEventListener`, and other globals — all tests fail with cryptic errors.

**Solution**: Assign to a property of the existing window:
```typescript
// Bad
(global as any).window = { electronAPI: mockElectronAPI };

// Good
(window as any).electronAPI = mockElectronAPI;
```

### ❌ matchMedia and ResizeObserver Not in jsdom
**Problem**: Ant Design components call `window.matchMedia()` and use `ResizeObserver` — both undefined in jsdom — causing all component tests to crash.

**Solution**: Stub both in `tests/setup.ts`:
```typescript
global.ResizeObserver = class ResizeObserver {
  observe() {} unobserve() {} disconnect() {}
};
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
```

### ❌ getAllByRole('button') Is Extremely Slow on Ant Design DOM
**Problem**: `screen.getAllByRole('button')` traverses the full accessibility tree. On a page with Ant Design Tabs + List, this takes 8+ seconds per call, timing out the entire test suite.

**Solution**: Use direct CSS selectors instead:
```typescript
// Bad — 8+ seconds
const editBtn = screen.getAllByRole('button').find(b => b.querySelector('[data-icon="edit"]'));

// Good — instant
const editBtn = document.querySelector<HTMLElement>('button[title="Rename"]');
fireEvent.click(editBtn!);
```

### ❌ Tests Depend on Execution Order
**Problem**: Tests pass individually but fail in suite

**Solution**: Each test should be independent
```typescript
// Bad
let sharedState;
it('test 1', () => { sharedState = 'value'; });
it('test 2', () => { expect(sharedState).toBe('value'); }); // Fragile!

// Good
beforeEach(() => {
  sharedState = initializeState();
});
```

### ❌ Testing Implementation Instead of Behavior
**Problem**: Tests break on refactors even if behavior unchanged

**Solution**: Test what, not how
```typescript
// Bad (testing implementation)
it('should call setData with filtered array', () => {
  const spy = vi.spyOn(component, 'setData');
  component.filter();
  expect(spy).toHaveBeenCalledWith(expect.any(Array));
});

// Good (testing behavior)
it('should display only active items when filtered', () => {
  render(<Component />);
  fireEvent.click(screen.getByText('Filter'));
  expect(screen.queryByText('Inactive Item')).not.toBeInTheDocument();
});
```

## Performance

### ❌ Expensive Operations in Render
**Problem**: Re-computing on every render slows UI

**Solution**: Use useMemo
```typescript
// Bad
const filtered = snippets.filter(s => s.name.includes(searchText)); // Every render!

// Good
const filtered = useMemo(() => 
  snippets.filter(s => s.name.includes(searchText)),
  [snippets, searchText]
);
```

### ❌ Not Debouncing Frequent Updates
**Problem**: Saving on every keystroke hammers disk

**Solution**: Debounce writes
```typescript
const debouncedSave = useMemo(
  () => debounce((data) => saveToFile(data), 500),
  []
);
```

## Security

### ❌ Exposing All Node APIs to Renderer
**Problem**: Renderer can access file system, execute arbitrary code

**Solution**: Context isolation + selective exposure via preload
```typescript
// preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  executeCode: (code: string) => ipcRenderer.invoke('execute-code', code),
  // Only expose what's needed
});
```

### ❌ Not Validating User Input
**Problem**: Malicious input can crash app or exploit vulnerabilities

**Solution**: Validate and sanitize
```typescript
function validateSnippetName(name: string): boolean {
  if (!name || name.length > 100) return false;
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) return false;
  return true;
}
```

## Build & Deploy

### ❌ Not Testing Production Build
**Problem**: Dev build works, production fails

**Solution**: Test `npm run build` before releasing
```bash
npm run build
npm run electron:build
# Test the packaged app
```

### ❌ Forgetting to Update Version
**Problem**: Release has wrong version number

**Solution**: Update package.json version before build
```bash
npm version patch  # or minor, major
npm run build
```

---

**Last Updated**: 2026-05-03
**Review**: Add new pitfalls as discovered
