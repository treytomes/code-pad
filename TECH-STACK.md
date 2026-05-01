# CodePad - Technology Stack

**Version**: 1.0  
**Date**: 2026-05-01  
**Target**: MVP (C# primary language support)  
**Platform**: Cross-platform Desktop (Electron)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend Stack](#frontend-stack)
3. [Backend/Execution Engine](#backendexecution-engine)
4. [C# Execution Strategy](#c-execution-strategy)
5. [Data Storage](#data-storage)
6. [Development Tools](#development-tools)
7. [Testing Framework](#testing-framework)
8. [Build & Distribution](#build--distribution)
9. [Dependencies & Versions](#dependencies--versions)

---

## Architecture Overview

### Application Type: Electron

**Electron** provides the best balance for MVP:
- True cross-platform (Windows, macOS, Linux)
- Native system access for code execution
- Mature ecosystem with extensive tooling
- Large community and documentation

### Process Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Main Process (Node.js)             │
│  - Application lifecycle                            │
│  - Window management                                │
│  - IPC coordinator                                  │
│  - File system operations                           │
│  - Database access                                  │
└────────────────┬────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐   ┌──────▼────────────────────────┐
│   Renderer   │   │   Execution Worker Process    │
│   Process    │   │   - Code execution            │
│   (Chromium) │   │   - Roslyn scripting          │
│   - React UI │   │   - Process isolation         │
│   - Monaco   │   │   - Resource limits           │
└──────────────┘   └───────────────────────────────┘
```

**Why this architecture:**
- **Main Process**: Privileged Node.js process handles system operations
- **Renderer Process**: Isolated UI (React + Monaco Editor)
- **Worker Process**: Separate Node.js process for code execution (security & stability)

---

## Frontend Stack

### UI Framework: **React 18**

**Choice Rationale:**
- Component-based architecture ideal for modular UI
- Huge ecosystem for Electron integration
- Excellent TypeScript support
- React hooks for state management
- Large community and resources

**Alternatives Considered:**
- Vue.js: Simpler but smaller Electron ecosystem
- Svelte: Newer, less proven with Electron

### Language: **TypeScript 5.x**

**Benefits:**
- Type safety for large codebase
- Better IDE support (IntelliSense)
- Catch errors at compile time
- Self-documenting code
- Easier refactoring

### Code Editor: **Monaco Editor**

**Version**: `monaco-editor` npm package (latest)

**Why Monaco:**
- Same editor as VS Code
- Built-in IntelliSense support
- Multi-language syntax highlighting
- Minimap, diff viewer, command palette
- Excellent TypeScript/JavaScript API
- Language Server Protocol (LSP) support

**Integration Library**: `@monaco-editor/react`
- React wrapper for Monaco
- Handles lifecycle and updates
- Simple API

### State Management: **Zustand**

**Why Zustand over Redux:**
- Simpler API (less boilerplate)
- TypeScript-first design
- No context providers needed
- Excellent DevTools integration
- Perfect for medium-sized apps

**Store Structure:**
```typescript
/stores
  /snippetStore.ts      // Snippet CRUD operations
  /editorStore.ts       // Editor state (tabs, cursor, etc.)
  /executionStore.ts    // Execution results and history
  /settingsStore.ts     // User preferences
```

### UI Component Library: **Ant Design (antd)**

**Why Ant Design:**
- Enterprise-grade components
- Excellent TypeScript support
- Built-in dark/light themes
- Rich component set (tables, trees, modals)
- Good documentation
- Works well with Electron

**Key Components Used:**
- `Tree` - Snippet explorer
- `Tabs` - Multi-snippet editing
- `Table` - Data output rendering
- `Drawer` - Settings panel
- `Modal` - Dialogs
- `Input`, `Select`, `Button` - Form controls

### Styling: **Tailwind CSS + CSS Modules**

**Tailwind CSS:**
- Utility-first CSS for rapid development
- Customizable design system
- Tree-shakeable (small bundle)
- Works alongside Ant Design

**CSS Modules:**
- Component-scoped styles
- No global namespace pollution
- Type-safe with TypeScript

**Layout Strategy:**
- Tailwind for layout and spacing
- Ant Design for complex components
- CSS Modules for custom component styles

### Routing: **None (Single-page app)**

- Electron apps don't need routing
- State-based view switching via Zustand
- Keep it simple for MVP

---

## Backend/Execution Engine

### Runtime: **Node.js 22.x** (LTS)

Already installed via nvm on the development machine.

### IPC Communication: **Electron IPC**

**Main ↔ Renderer:**
- `ipcMain` / `ipcRenderer`
- Context bridge for security
- Typed IPC channels

**Main ↔ Worker:**
- `child_process.fork()`
- JSON message passing
- Stream handling for output

### Process Management: **child_process**

```typescript
import { fork, spawn } from 'child_process';

// For C# execution
spawn('dotnet', ['script', 'snippet.csx']);

// For worker processes
fork('./execution-worker.js');
```

### Execution Worker Architecture

**File**: `src/backend/execution-worker.ts`

**Responsibilities:**
- Receive code execution requests via IPC
- Spawn language-specific processes (dotnet, python, etc.)
- Capture stdout/stderr streams
- Enforce timeouts and resource limits
- Return structured results

**Benefits:**
- Isolates crashes (worker crash won't kill main app)
- Easy to restart if worker hangs
- Resource monitoring per execution
- Clean separation of concerns

---

## C# Execution Strategy

### Primary Method: **.NET CLI + Roslyn Scripting**

**Approach 1: C# Script Files (.csx) - RECOMMENDED FOR MVP**

**How it works:**
1. User writes C# code in Monaco Editor
2. Save code to temporary `.csx` file
3. Execute: `dotnet script <file.csx>`
4. Capture output and parse

**Tool**: `dotnet-script` (global tool)

**Installation**:
```bash
dotnet tool install -g dotnet-script
```

**Pros:**
- Simple implementation
- Full C# language support
- NuGet package support
- REPL-like experience
- No compilation overhead

**Cons:**
- Requires .NET SDK installed on user machine
- External process overhead
- Limited control over execution environment

**Example Execution:**
```typescript
// execution-worker.ts
const { spawn } = require('child_process');

function executeCS(code: string, timeout: number = 30000) {
  return new Promise((resolve, reject) => {
    // Write code to temp file
    const tempFile = `/tmp/snippet-${Date.now()}.csx`;
    fs.writeFileSync(tempFile, code);
    
    // Execute
    const process = spawn('dotnet', ['script', tempFile], {
      timeout,
      env: { ...process.env }
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => stdout += data);
    process.stderr.on('data', (data) => stderr += data);
    
    process.on('close', (code) => {
      fs.unlinkSync(tempFile); // Cleanup
      resolve({ stdout, stderr, exitCode: code });
    });
  });
}
```

---

### Approach 2: Roslyn Scripting API (Future Enhancement)

**How it works:**
- Host Roslyn in a .NET process
- Communicate with Node.js via JSON-RPC or gRPC
- Keep process warm for faster execution

**Pros:**
- Faster execution (no process spawn overhead)
- More control over execution environment
- Can capture rich object graphs
- Better debugging support

**Cons:**
- More complex architecture
- Requires maintaining a .NET service
- Cross-platform IPC complexity

**Decision**: Defer to Phase 2. Start with `dotnet script` for simplicity.

---

### C# Code Execution Modes

#### 1. Expression Mode
```csharp
// User input
1 + 1

// Auto-wrap in Console.WriteLine
Console.WriteLine(1 + 1);
```

#### 2. Statement Mode
```csharp
// User input
var x = 5;
var y = 10;
Console.WriteLine(x + y);
```

#### 3. Program Mode (Top-level Statements)
```csharp
// User input (C# 9+ style)
Console.WriteLine("Hello World");
var numbers = Enumerable.Range(1, 10);
foreach (var n in numbers) {
    Console.WriteLine(n);
}
```

#### 4. Full Program Mode
```csharp
// Traditional with Main method
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello World");
    }
}
```

**Implementation**:
- Detect mode by parsing code
- Auto-wrap expressions in `Console.WriteLine()` if needed
- Add necessary `using` statements

---

### NuGet Package Support

**Implementation**:
1. Parse `#r "nuget: PackageName, Version"` directives (dotnet-script syntax)
2. Or provide UI for package management
3. Generate `.csx` file with directives
4. `dotnet script` handles package restoration automatically

**Example**:
```csharp
#r "nuget: Newtonsoft.Json, 13.0.3"

using Newtonsoft.Json;

var obj = new { Name = "CodePad", Version = "1.0" };
Console.WriteLine(JsonConvert.SerializeObject(obj, Formatting.Indented));
```

---

### Rich Output (.Dump() Equivalent)

**Challenge**: Capture object graphs, not just ToString()

**Solution for MVP**:
1. **JSON Serialization Approach**
   ```csharp
   // Helper method injected into user code
   public static void Dump(object obj) {
       var json = System.Text.Json.JsonSerializer.Serialize(obj, 
           new JsonSerializerOptions { 
               WriteIndented = true,
               ReferenceHandler = ReferenceHandler.Preserve 
           });
       Console.WriteLine("__DUMP_START__");
       Console.WriteLine(json);
       Console.WriteLine("__DUMP_END__");
   }
   ```

2. **Parse Output**
   - Look for `__DUMP_START__` and `__DUMP_END__` markers
   - Parse JSON between markers
   - Render in UI with collapsible tree view

**Phase 2 Enhancement**:
- Use MessagePack or Protocol Buffers for better serialization
- Support circular references
- Lazy-load large collections
- Image rendering for byte arrays

---

## Data Storage

### Database: **SQLite 3 + better-sqlite3**

**Why SQLite:**
- Serverless (embedded)
- Cross-platform
- Single file database
- ACID compliant
- Excellent Node.js bindings

**Node.js Package**: `better-sqlite3`
- Faster than `sqlite3` (synchronous API)
- Better TypeScript support
- Works with Electron

**Database Location**: `~/.codepad/codepad.db`

### Schema Design

```sql
-- Snippets table
CREATE TABLE snippets (
    id TEXT PRIMARY KEY,              -- UUID
    name TEXT NOT NULL,
    description TEXT,
    language TEXT NOT NULL,           -- 'csharp', 'python', etc.
    file_path TEXT NOT NULL,          -- Relative path to content file
    created_at INTEGER NOT NULL,      -- Unix timestamp
    modified_at INTEGER NOT NULL,
    last_executed_at INTEGER,
    execution_count INTEGER DEFAULT 0,
    is_starred INTEGER DEFAULT 0,     -- Boolean (0/1)
    folder TEXT,                      -- Folder path (e.g., 'My Snippets/Algorithms')
    metadata TEXT                     -- JSON blob for extensibility
);

-- Tags table (many-to-many)
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE snippet_tags (
    snippet_id TEXT NOT NULL,
    tag_id INTEGER NOT NULL,
    FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (snippet_id, tag_id)
);

-- Execution history (optional, for analytics)
CREATE TABLE execution_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snippet_id TEXT NOT NULL,
    executed_at INTEGER NOT NULL,
    duration_ms INTEGER,
    exit_code INTEGER,
    had_error INTEGER,
    FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE
);

-- Settings table
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL              -- JSON value
);

-- Indexes
CREATE INDEX idx_snippets_language ON snippets(language);
CREATE INDEX idx_snippets_modified ON snippets(modified_at DESC);
CREATE INDEX idx_snippets_starred ON snippets(is_starred);
CREATE INDEX idx_snippet_tags_snippet ON snippet_tags(snippet_id);
CREATE INDEX idx_snippet_tags_tag ON snippet_tags(tag_id);
```

### ORM: **None (Direct SQL)**

**Why no ORM:**
- Simple schema doesn't need abstraction
- Direct SQL is faster
- Better control over queries
- TypeScript types for query results

**Helper Utility**:
```typescript
// src/backend/database.ts
import Database from 'better-sqlite3';

export class SnippetDB {
    private db: Database.Database;
    
    constructor(dbPath: string) {
        this.db = new Database(dbPath);
        this.initialize();
    }
    
    private initialize() {
        // Run schema creation
    }
    
    public getSnippet(id: string): Snippet | null {
        const stmt = this.db.prepare('SELECT * FROM snippets WHERE id = ?');
        return stmt.get(id) as Snippet | null;
    }
    
    // ... other methods
}
```

### File Storage

**Snippet Content Files**: `~/.codepad/snippets/`

**Naming Convention**: `{uuid}.{extension}`
- `abc123-def456.csx` (C# script)
- `xyz789-ghi012.py` (Python)

**Why separate files:**
- Large code blocks don't bloat database
- Easy to back up
- Can use git for version control
- Simpler to edit externally

**File Access**:
```typescript
import fs from 'fs/promises';
import path from 'path';

export class SnippetStorage {
    private baseDir: string;
    
    constructor(baseDir: string) {
        this.baseDir = baseDir;
    }
    
    async readSnippet(id: string, ext: string): Promise<string> {
        const filePath = path.join(this.baseDir, `${id}.${ext}`);
        return await fs.readFile(filePath, 'utf-8');
    }
    
    async writeSnippet(id: string, ext: string, content: string): Promise<void> {
        const filePath = path.join(this.baseDir, `${id}.${ext}`);
        await fs.writeFile(filePath, content, 'utf-8');
    }
}
```

---

## Development Tools

### Package Manager: **npm**

Already available via Node.js 22.11.0 (nvm).

**Why not yarn/pnpm:**
- npm is sufficient for this project
- One less tool to manage
- Better Electron ecosystem compatibility

### Code Quality

#### Linting: **ESLint**

**Config**: `eslint.config.js` (Flat Config)

**Plugins**:
- `@typescript-eslint/eslint-plugin` - TypeScript rules
- `eslint-plugin-react` - React rules
- `eslint-plugin-react-hooks` - React hooks rules

#### Formatting: **Prettier**

**Integration**:
- `eslint-config-prettier` - Disable conflicting ESLint rules
- `eslint-plugin-prettier` - Run Prettier as ESLint rule

**Config**: `.prettierrc.json`
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### Git Hooks: **Husky + lint-staged**

**Pre-commit Hook**:
- Run ESLint on staged files
- Run Prettier on staged files
- Prevent commits with errors

**Setup**:
```bash
npx husky-init && npm install
npx husky set .husky/pre-commit "npx lint-staged"
```

**lint-staged config** (package.json):
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### TypeScript Configuration

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Testing Framework

### Unit Testing: **Vitest**

**Why Vitest:**
- Fast (powered by Vite)
- ESM and TypeScript support out of the box
- Jest-compatible API
- Excellent DX with hot module reload

**Alternative**: Jest (more mature, but slower)

### React Testing: **React Testing Library**

**Why RTL:**
- Tests behavior, not implementation
- Encourages accessible components
- Works well with Vitest

### E2E Testing: **Playwright**

**Why Playwright:**
- Electron support
- Cross-browser (Chromium, WebKit, Firefox)
- Auto-wait and retry
- Excellent debugging

**Test Structure**:
```
/tests
  /unit              // Vitest unit tests
    /stores
    /utils
  /integration       // Vitest integration tests
    /database
    /execution
  /e2e               // Playwright E2E tests
    /snippets.spec.ts
    /execution.spec.ts
```

---

## Build & Distribution

### Bundler: **Vite**

**Why Vite:**
- Extremely fast dev server (ESBuild)
- Native ESM support
- Excellent TypeScript support
- Built-in HMR
- Optimized production builds (Rollup)

**Electron Integration**: `vite-plugin-electron`
- Bundles main and renderer processes
- Hot reload for both processes
- Simple configuration

### Electron Builder: **electron-builder**

**Why electron-builder:**
- Industry standard for Electron apps
- Supports all platforms (Windows, macOS, Linux)
- Code signing
- Auto-update support
- DMG, NSIS, AppImage, Snap, etc.

**Build Configuration** (electron-builder.json):
```json
{
  "appId": "com.codepad.app",
  "productName": "CodePad",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "node_modules/**/*",
    "package.json"
  ],
  "win": {
    "target": ["nsis", "portable"],
    "icon": "build/icon.ico"
  },
  "mac": {
    "target": ["dmg", "zip"],
    "icon": "build/icon.icns",
    "category": "public.app-category.developer-tools"
  },
  "linux": {
    "target": ["AppImage", "deb"],
    "icon": "build/icon.png",
    "category": "Development"
  }
}
```

### Auto-Update: **electron-updater**

**Built into electron-builder**:
- GitHub Releases integration
- Delta updates (smaller downloads)
- Automatic background updates
- User notification system

---

## Dependencies & Versions

### Core Dependencies

```json
{
  "name": "codepad",
  "version": "0.1.0",
  "description": "Cross-platform code scratchpad",
  "main": "dist/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "electron:dev": "electron .",
    "electron:build": "electron-builder",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint src --ext ts,tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx}\""
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "electron": "^30.0.0",
    "electron-updater": "^6.2.0",
    "@monaco-editor/react": "^4.6.0",
    "monaco-editor": "^0.48.0",
    "antd": "^5.17.0",
    "zustand": "^4.5.0",
    "better-sqlite3": "^10.0.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/better-sqlite3": "^7.6.10",
    "@types/uuid": "^9.0.8",
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.2.0",
    "vite-plugin-electron": "^0.28.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0",
    "@testing-library/react": "^15.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "playwright": "^1.44.0",
    "eslint": "^8.57.0",
    "@typescript-eslint/eslint-plugin": "^7.8.0",
    "@typescript-eslint/parser": "^7.8.0",
    "eslint-plugin-react": "^7.34.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.0",
    "prettier": "^3.2.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.2.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "electron-builder": "^24.13.0"
  }
}
```

### External Runtime Dependencies

**User must have installed:**

1. **.NET SDK 8.0 or later**
   - Download: https://dotnet.microsoft.com/download
   - Required for C# code execution
   - `dotnet-script` global tool

2. **Python 3.10+ (Phase 2)**
   - For Python code execution

**Detection Logic**:
```typescript
// Check if .NET is available
async function checkDotnetInstalled(): Promise<boolean> {
  try {
    const result = await execAsync('dotnet --version');
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

// Prompt user to install if missing
if (!await checkDotnetInstalled()) {
  dialog.showMessageBox({
    type: 'warning',
    title: 'Missing .NET SDK',
    message: '.NET SDK is required to execute C# code.',
    detail: 'Please install .NET 8.0 or later from https://dotnet.microsoft.com/download',
    buttons: ['Open Download Page', 'Cancel']
  });
}
```

---

## Project Structure

```
code-pad/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── electron-builder.json
├── .eslintrc.json
├── .prettierrc.json
├── tailwind.config.js
├── postcss.config.js
├── CLAUDE.md
├── REQUIREMENTS.md
├── TECH-STACK.md (this file)
├── README.md
├── LICENSE
│
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts            # Entry point
│   │   ├── ipc-handlers.ts     # IPC message handlers
│   │   ├── window-manager.ts   # Window creation
│   │   └── menu.ts             # Application menu
│   │
│   ├── renderer/                # React frontend
│   │   ├── index.tsx           # Entry point
│   │   ├── App.tsx             # Root component
│   │   ├── components/         # React components
│   │   │   ├── Editor/
│   │   │   ├── SnippetExplorer/
│   │   │   ├── OutputPanel/
│   │   │   └── StatusBar/
│   │   ├── stores/             # Zustand stores
│   │   ├── hooks/              # Custom React hooks
│   │   ├── utils/              # Utilities
│   │   └── styles/             # Global styles
│   │
│   ├── backend/                 # Node.js backend logic
│   │   ├── database.ts         # SQLite wrapper
│   │   ├── snippet-storage.ts  # File storage
│   │   ├── execution-worker.ts # Code execution worker
│   │   └── executors/          # Language-specific executors
│   │       ├── csharp.ts
│   │       └── python.ts (future)
│   │
│   ├── shared/                  # Shared types/utils
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── constants.ts        # Constants
│   │   └── ipc-channels.ts     # IPC channel names
│   │
│   └── preload/                 # Electron preload script
│       └── index.ts            # Context bridge
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── build/                       # Build assets
│   ├── icon.ico
│   ├── icon.icns
│   └── icon.png
│
└── dist/                        # Build output (gitignored)
```

---

## Development Workflow

### Initial Setup

```bash
cd /home/trey/projects/code-pad

# Initialize npm project
npm init -y

# Install dependencies
npm install <dependencies from above>

# Install .NET global tool
dotnet tool install -g dotnet-script

# Initialize Git hooks
npx husky install
```

### Development Commands

```bash
# Start dev server (renderer only)
npm run dev

# Start Electron in dev mode
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

### Hot Reload Setup

**Vite + Electron:**
- Renderer: Hot Module Reload (HMR) via Vite
- Main process: Watch mode with auto-restart
- Preload script: Watch mode with reload

---

## Performance Considerations

### Startup Time Target: < 2 seconds

**Optimizations:**
- Code splitting (lazy load Monaco Editor)
- SQLite connection pooling
- Preload recent snippets in background
- Defer non-critical initializations

### Memory Target: < 200MB idle

**Monitoring:**
- `process.memoryUsage()` tracking
- Chrome DevTools memory profiling
- Electron's built-in performance tools

### Build Size Target: < 100MB

**Optimizations:**
- Tree-shaking (Vite/Rollup)
- Exclude dev dependencies
- Compress assets (images, fonts)
- Consider bundling .NET runtime (future)

---

## Security Considerations

### Electron Security Best Practices

1. **Enable Context Isolation**
   ```typescript
   // main/window-manager.ts
   new BrowserWindow({
     webPreferences: {
       contextIsolation: true,
       nodeIntegration: false,
       sandbox: true,
       preload: path.join(__dirname, 'preload.js')
     }
   });
   ```

2. **Use Content Security Policy (CSP)**
   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self'; script-src 'self'">
   ```

3. **Validate IPC Messages**
   ```typescript
   // Validate all inputs from renderer
   ipcMain.handle('execute-code', async (event, { code, language }) => {
     if (typeof code !== 'string' || typeof language !== 'string') {
       throw new Error('Invalid parameters');
     }
     // ... execute
   });
   ```

4. **Sanitize User Code**
   - Don't execute code directly in main process
   - Use isolated worker processes
   - Enforce resource limits
   - Timeout long-running executions

### Code Execution Security

1. **Sandboxing**
   - Spawn processes with limited permissions
   - Use temp directories with restricted access
   - Clean up after execution

2. **Resource Limits**
   - Max execution time: 30 seconds (default)
   - Max memory: 512MB per execution
   - Max output size: 10MB

3. **File System Access**
   - Restrict to user's home directory by default
   - Prompt for file access outside workspace
   - Never grant write access to system directories

---

## Future Enhancements

### Phase 2 Considerations

1. **Language Server Protocol (LSP)**
   - Full IntelliSense for C# (OmniSharp)
   - Go to Definition, Find References
   - Real-time error checking

2. **Roslyn Hosting**
   - Replace `dotnet script` with hosted Roslyn
   - Faster execution
   - Better debugging support

3. **Plugin System**
   - Custom language support
   - Custom output formatters
   - Theme extensions

4. **Cloud Sync**
   - Optional cloud storage
   - End-to-end encryption
   - Conflict resolution

---

## Decision Log

| Decision | Rationale | Date |
|----------|-----------|------|
| Electron over Tauri | Mature ecosystem, better for MVP | 2026-05-01 |
| React over Vue | Larger community, better TypeScript support | 2026-05-01 |
| Zustand over Redux | Simpler API, less boilerplate | 2026-05-01 |
| Monaco Editor | Industry standard, LSP support | 2026-05-01 |
| dotnet-script over Roslyn hosting | Simpler for MVP, defer complexity | 2026-05-01 |
| better-sqlite3 over typeorm | Direct SQL, better performance | 2026-05-01 |
| Vite over Webpack | Faster dev server, better DX | 2026-05-01 |
| Vitest over Jest | Faster, better ESM support | 2026-05-01 |

---

## References

- [Electron Documentation](https://www.electronjs.org/docs/latest/)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/index.html)
- [Roslyn Scripting](https://github.com/dotnet/roslyn/wiki/Scripting-API-Samples)
- [dotnet-script](https://github.com/dotnet-script/dotnet-script)
- [React 18 Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [electron-builder](https://www.electron.build/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)

---

**Document Status**: Ready for Implementation  
**Next Steps**: 
1. Initialize npm project
2. Set up project structure
3. Configure build tools
4. Create proof-of-concept for C# execution
5. Build basic UI skeleton
