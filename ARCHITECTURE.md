# CodePad Architecture

**Version**: 1.0  
**Date**: 2026-05-01

---

## Overview

CodePad is an Electron-based desktop application for running code snippets with a focus on C# development. The architecture follows a standard Electron pattern with separated main process, renderer process, and secure IPC communication.

---

## Technology Stack

- **Framework**: Electron 30.x
- **UI Library**: React 19.x with TypeScript
- **Component Library**: Ant Design 6.x with dark theme
- **Editor**: Monaco Editor (VS Code editor)
- **Database**: SQLite (better-sqlite3) with WAL mode
- **Build System**: Vite 6.x with electron plugin
- **Styling**: Tailwind CSS 4.x + custom VS Code theme
- **Testing**: Vitest with jsdom for components

---

## Process Architecture

### Main Process (`src/main/`)

The main process handles:
- Application lifecycle and window management
- IPC handlers for code execution and database operations
- System-level operations

**Key Files**:
- `index.ts` - Entry point, window creation, IPC setup

### Renderer Process (`src/renderer/`)

The renderer process handles:
- User interface rendering
- User interactions
- Communication with main process via IPC

**Key Files**:
- `index.tsx` - Entry point with ConfigProvider theme setup
- `App.tsx` - Main application component with layout
- `components/` - Reusable UI components
- `styles/` - Global CSS and theme variables

### Preload Script (`src/preload/`)

Secure bridge between renderer and main process:
- Exposes safe APIs to renderer via `contextBridge`
- Type-safe IPC invocations

**Key Files**:
- `index.ts` - Context bridge setup with `electronAPI`

---

## Component Hierarchy

```
App (src/renderer/App.tsx)
├── ConfigProvider (Ant Design theme wrapper)
│   └── Layout (Ant Design top-level layout)
│       ├── Header
│       │   ├── Title: "CodePad"
│       │   └── Toolbar
│       │       ├── Button: New
│       │       ├── Button: Save As / Update
│       │       └── Button: Run Code
│       │
│       └── Layout (horizontal split)
│           ├── Sider (resizable sidebar, 150-500px)
│           │   ├── SnippetList
│           │   │   ├── Select: Language filter
│           │   │   └── List
│           │   │       └── List.Item (per snippet)
│           │   │           ├── CodeOutlined icon
│           │   │           ├── Text: Snippet name
│           │   │           ├── Text: Language
│           │   │           ├── Text: Execution count
│           │   │           └── Button: Delete (with Popconfirm)
│           │   └── Resize Handle (right edge)
│           │
│           └── Content (vertical split)
│               ├── CodeEditor (Monaco Editor wrapper)
│               │   └── Monaco Editor instance
│               │
│               ├── Resize Handle (horizontal)
│               │
│               └── Output Panel (resizable, 100px-max)
│                   ├── Label: "OUTPUT"
│                   └── Pre: Output text
│
└── Modal: Save Snippet
    ├── Input: Snippet name
    └── Buttons: OK / Cancel
```

---

## Component Details

### App Component (`src/renderer/App.tsx`)

**Responsibilities**:
- Main application state management
- Layout and panel sizing
- IPC communication coordination
- Snippet CRUD operations

**State**:
- `code` - Current code in editor
- `output` - Execution output text
- `outputHeight` - Output panel height (px)
- `sidebarWidth` - Sidebar width (px)
- `isDraggingOutput` - Output resize drag state
- `isDraggingSidebar` - Sidebar resize drag state
- `currentSnippetId` - Active snippet ID
- `saveModalVisible` - Save dialog visibility
- `snippetName` - Name for new snippet
- `refreshTrigger` - Counter to trigger snippet list refresh

**Key Functions**:
- `handleRun()` - Execute code via IPC
- `handleSaveNew()` / `handleSaveExisting()` - Save snippets
- `handleSelectSnippet()` - Load snippet into editor
- `handleDeleteSnippet()` - Delete snippet via IPC
- `handleOutputMouseDown()` / `handleSidebarMouseDown()` - Resize handlers
- `handleMouseMove()` - Drag resize logic
- `handleMouseUp()` - End drag operation

### CodeEditor Component (`src/renderer/components/Editor/`)

**Responsibilities**:
- Monaco Editor integration
- Syntax highlighting (C# default)
- Code editing interface

**Props**:
- `value: string` - Code content
- `onChange: (code: string) => void` - Change callback
- `language?: string` - Programming language (default: csharp)
- `theme?: string` - Editor theme (default: vs-dark)
- `readOnly?: boolean` - Read-only mode
- `height?: string` - Editor height

### SnippetList Component (`src/renderer/components/SnippetList/`)

**Responsibilities**:
- Display saved snippets
- Language filtering
- Snippet selection and deletion

**Props**:
- `onSelectSnippet: (snippet: Snippet) => void` - Selection callback
- `onDeleteSnippet: (id: string) => void` - Deletion callback
- `refreshTrigger?: number` - Trigger to reload list

**State**:
- `snippets` - Array of snippet records
- `loading` - Loading state
- `languageFilter` - Current language filter

---

## Data Flow

### Code Execution Flow

```
1. User clicks "Run Code" button
2. App.handleRun() invoked
3. IPC call: window.electronAPI.executeCode(code)
   ↓
4. Preload forwards to main process: ipcRenderer.invoke('execute-code')
   ↓
5. Main process handler executes code via CSharpExecutor
6. CSharpExecutor spawns dotnet-script process
7. Captures stdout/stderr
8. Returns ExecutionResult
   ↓
9. Result returned to renderer
10. App updates output state
11. If snippet loaded, increment execution count
```

### Snippet Save Flow

```
1. User enters snippet name in modal
2. App.handleSaveConfirm() invoked
3. IPC call: window.electronAPI.db.createSnippet({name, language, code})
   ↓
4. Preload forwards: ipcRenderer.invoke('db-create-snippet')
   ↓
5. Main process handler calls SnippetDatabase.createSnippet()
6. SQLite INSERT with UUID generation
7. Returns Snippet object
   ↓
8. Result returned to renderer
9. App updates currentSnippetId
10. SnippetList refreshed via refreshTrigger
```

### Snippet Load Flow

```
1. User clicks snippet in list
2. SnippetList.onSelectSnippet() → App.handleSelectSnippet()
3. App updates:
   - code state (loads snippet.code into editor)
   - currentSnippetId (tracks active snippet)
   - output reset to empty
4. Monaco Editor re-renders with new code
```

---

## Database Schema

### Snippets Table

```sql
CREATE TABLE snippets (
  id TEXT PRIMARY KEY,           -- UUID
  name TEXT NOT NULL,            -- Display name
  language TEXT NOT NULL,        -- Programming language
  code TEXT NOT NULL,            -- Source code
  createdAt INTEGER NOT NULL,    -- Unix timestamp (ms)
  modifiedAt INTEGER NOT NULL,   -- Unix timestamp (ms)
  executionCount INTEGER DEFAULT 0
);

CREATE INDEX idx_snippets_language ON snippets(language);
CREATE INDEX idx_snippets_createdAt ON snippets(createdAt DESC);
```

**Location**: `~/.codepad/codepad.db`

---

## IPC API

### Code Execution

```typescript
window.electronAPI.executeCode(
  code: string,
  options?: { timeout?: number }
): Promise<ExecutionResult>

// ExecutionResult
{
  exitCode: number;
  stdout: string;
  stderr: string;
  error?: string;
}
```

### Database Operations

```typescript
// Create
window.electronAPI.db.createSnippet(snippet: {
  name: string;
  language: string;
  code: string;
}): Promise<Snippet>

// Read
window.electronAPI.db.getSnippet(id: string): Promise<Snippet | null>
window.electronAPI.db.listSnippets(language?: string): Promise<Snippet[]>

// Update
window.electronAPI.db.updateSnippet(
  id: string,
  updates: { name?: string; code?: string }
): Promise<boolean>

window.electronAPI.db.incrementExecution(id: string): Promise<boolean>

// Delete
window.electronAPI.db.deleteSnippet(id: string): Promise<boolean>
```

---

## Styling Architecture

### Theme System

**Primary**: Ant Design ConfigProvider with custom VS Code-inspired token values

```typescript
ConfigProvider({
  theme: {
    algorithm: theme.darkAlgorithm,
    token: {
      colorBgBase: '#1e1e1e',        // Editor background
      colorBgContainer: '#252526',    // Sidebar background
      colorBorder: '#2d2d30',         // Border color
      colorPrimary: '#007acc',        // Accent blue
      colorText: '#cccccc',           // Primary text
      colorTextSecondary: '#858585',  // Secondary text
    },
    components: { /* ... */ }
  }
})
```

### CSS Variables

```css
:root {
  --vscode-bg: #1e1e1e;
  --vscode-sidebar-bg: #252526;
  --vscode-panel-bg: #181818;
  --vscode-border: #2d2d30;
  --vscode-header-bg: #323233;
  --vscode-text: #cccccc;
  --vscode-text-secondary: #858585;
  --vscode-accent: #007acc;
  /* ... */
}
```

### Component-Specific Styles

- **Global CSS**: `src/renderer/styles/index.css` - Base styles, CSS variables, minimal overrides
- **Inline Styles**: Component-specific positioning and sizing
- **Ant Design**: Component theming via ConfigProvider

---

## Backend Services

### CSharpExecutor (`src/backend/executors/csharp.ts`)

**Responsibilities**:
- Execute C# code using `dotnet-script`
- Handle timeouts and errors
- Capture stdout/stderr
- Manage PATH for dotnet discovery

**Key Methods**:
- `execute(code: string, options?: ExecutionOptions): Promise<ExecutionResult>`
- `findDotnetPath(): string` - Windows PATH augmentation

### SnippetDatabase (`src/backend/database.ts`)

**Responsibilities**:
- SQLite database operations
- CRUD operations for snippets
- Schema initialization
- WAL mode configuration

**Key Methods**:
- `createSnippet(snippet): Snippet`
- `getSnippet(id): Snippet | null`
- `updateSnippet(id, updates): boolean`
- `deleteSnippet(id): boolean`
- `listSnippets(language?): Snippet[]`
- `incrementExecutionCount(id): boolean`

---

## Build & Distribution

### Development

```bash
npm run dev          # Start Vite dev server (renderer only)
npm run electron:dev # Build + start Electron app
npm test            # Run unit tests
npm run lint        # ESLint check
```

### Production Build

```bash
npm run build               # Build main + renderer
npm run electron:build      # Package with electron-builder
```

**Output**:
- `dist/` - Compiled code (main, renderer, preload)
- `release/` - Platform-specific installers (NSIS, DMG, AppImage)

### electron-builder Configuration

```json
{
  "appId": "com.codepad.app",
  "files": ["dist/**/*", "package.json"],
  "win": { "target": "nsis" },
  "mac": { "target": "dmg" },
  "linux": { "target": ["AppImage", "deb"] }
}
```

---

## Security Considerations

1. **Context Isolation**: Enabled (preload script uses contextBridge)
2. **Node Integration**: Disabled in renderer
3. **Sandboxing**: Code execution happens in main process with resource limits
4. **IPC Validation**: All IPC handlers validate inputs
5. **Database**: SQLite prepared statements prevent SQL injection

---

## Performance Optimizations

1. **Monaco Editor**: Lazy-loaded worker files (json, html, css, typescript)
2. **Database**: WAL mode for better concurrency
3. **React**: Minimal re-renders with proper state management
4. **Build**: Vite's fast HMR in development
5. **Chunking**: Large Monaco workers split from main bundle

---

## Testing Strategy

### Unit Tests

- **Components**: React Testing Library with jsdom
- **Backend Services**: Pure TypeScript unit tests
- **Coverage Target**: 70%+

### Test Files

- `tests/unit/backend/database.test.ts` - SnippetDatabase (100% coverage)
- `tests/unit/executors/csharp.test.ts` - CSharpExecutor
- `tests/unit/renderer/CodeEditor.test.tsx` - Monaco integration

### Running Tests

```bash
npm test              # Watch mode
npm run test:coverage # Coverage report
```

---

## Future Architecture Considerations

### Phase 1 Extensions

- **Multi-tab support**: Editor state management per tab
- **Folder organization**: Tree structure for snippets
- **Search functionality**: Full-text search across snippets

### Phase 2 Extensions

- **NuGet integration**: Package resolution and caching
- **Python executor**: Additional language support
- **Rich output**: Object inspection UI

### Phase 3 Extensions

- **Database connectivity**: Connection management UI
- **Git integration**: Version control for snippets
- **Export/import**: Snippet sharing and backup

---

## Troubleshooting

### Common Issues

**Issue**: "spawn dotnet ENOENT"  
**Solution**: Ensure .NET SDK installed, check PATH environment variable

**Issue**: Monaco Editor not loading  
**Solution**: Check worker files in dist/renderer/assets/

**Issue**: SQLite database locked  
**Solution**: WAL mode enabled, check for zombie processes

**Issue**: Hot reload not working  
**Solution**: Restart Vite dev server, check file watcher limits

---

**Document Status**: Complete  
**Last Updated**: 2026-05-01  
**Maintainer**: CodePad Team
