# VS Code Configuration Guide

This directory contains VS Code workspace configuration for the CodePad project.

## Quick Start

1. **Open project in VS Code**:
   ```bash
   code .
   ```

2. **Install recommended extensions** when prompted

3. **Run a task**: `Ctrl+Shift+P` → "Tasks: Run Task" → Select task

4. **Debug**: Press `F5` to start debugging Electron main process

## Files Overview

### `tasks.json` - Build & Development Tasks

Access via: `Ctrl+Shift+P` → "Tasks: Run Task"

**Common Tasks**:
- `npm: dev` - Start Vite dev server (hot reload for renderer)
- `npm: electron:dev` - Start full Electron app
- `npm: build` - Build project (also: `Ctrl+Shift+B`)
- `npm: test` - Run Vitest tests
- `npm: lint` - Run ESLint
- `npm: format` - Format with Prettier

**Utility Tasks**:
- `npm: install` - Install deps with Python venv
- `Activate Python venv` - Source Python virtual environment
- `Install .NET dotnet-script` - Install C# execution tool
- `Check .NET version` - Verify .NET SDK installed

### `launch.json` - Debug Configurations

Access via: `F5` or Debug panel (`Ctrl+Shift+D`)

**Configurations**:
1. **Debug Main Process** - Debug Electron main (Node.js)
   - Builds project first
   - Source maps enabled
   - Breakpoints in `src/main/`

2. **Debug Renderer Process** - Debug React UI (Chrome)
   - Attaches to Electron renderer on port 9222
   - Breakpoints in `src/renderer/`
   - Requires Electron to be running with `--remote-debugging-port=9222`

3. **Debug Electron (Main + Renderer)** - Debug both simultaneously
   - Compound configuration
   - Stops all when one stops

4. **Run/Debug Vitest Tests** - Test debugging
   - Run all tests or debug with breakpoints

### `settings.json` - Workspace Settings

**Key Settings**:
- **Format on Save**: Enabled with Prettier
- **ESLint Auto-fix**: Runs on save
- **Python Interpreter**: Auto-detects `venv/bin/python`
- **TypeScript**: Uses workspace version
- **Tailwind CSS**: IntelliSense for utility classes
- **File Exclusions**: Hides `node_modules`, `dist` from explorer
- **Terminal**: Sets `PYTHON` env var for npm installs

**Override Locally**:
Create `.vscode/settings.local.json` for personal settings (gitignored).

### `extensions.json` - Recommended Extensions

VS Code will prompt to install these on first open:

**Essentials**:
- `dbaeumer.vscode-eslint` - JavaScript/TypeScript linting
- `esbenp.prettier-vscode` - Code formatter
- `ms-vscode.vscode-typescript-next` - Latest TypeScript support

**UI/CSS**:
- `bradlc.vscode-tailwindcss` - Tailwind CSS IntelliSense

**Python**:
- `ms-python.python` - Python support
- `ms-python.vscode-pylance` - Fast language server

**Testing**:
- `ms-playwright.playwright` - Playwright test runner
- `vitest.explorer` - Vitest test explorer UI

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+P` | Command Palette |
| `Ctrl+Shift+B` | Run Build Task |
| `Ctrl+Shift+T` | Run Task |
| `F5` | Start Debugging |
| `Shift+F5` | Stop Debugging |
| `Ctrl+Shift+D` | Open Debug Panel |
| `Ctrl+Shift+E` | Open Explorer |
| `Ctrl+Shift+X` | Open Extensions |
| `Ctrl+` ` | Toggle Terminal |
| `Ctrl+Shift+` ` | New Terminal |

## Debugging Tips

### Debug Electron Main Process
1. Set breakpoints in `src/main/` files
2. Press `F5` or select "Debug Main Process"
3. Electron app will launch with debugger attached
4. Execution pauses at breakpoints

### Debug Renderer Process (React UI)
1. Start Electron with remote debugging: 
   ```bash
   npm run electron:dev -- --remote-debugging-port=9222
   ```
2. Attach debugger: Select "Debug Renderer Process" and press `F5`
3. Set breakpoints in `src/renderer/` files
4. DevTools also available in Electron window (`Ctrl+Shift+I`)

### Debug Both Together
1. Select "Debug Electron (Main + Renderer)"
2. Press `F5`
3. Both debuggers attach simultaneously

### Debug Tests
1. Set breakpoints in test files
2. Select "Debug Vitest Tests"
3. Press `F5`
4. Tests run with debugger attached

## Terminal Integration

The integrated terminal is configured with:
- `PYTHON` environment variable pointing to `venv/bin/python`
- Auto-activation of Python venv when opening new terminals
- Node.js from nvm (22.11.0) automatically detected

## Troubleshooting

### "Cannot find module" errors
- Run task: `npm: install`
- Or terminal: `npm install`

### ESLint not working
- Install extension: `dbaeumer.vscode-eslint`
- Reload window: `Ctrl+Shift+P` → "Developer: Reload Window"

### Prettier not formatting
- Install extension: `esbenp.prettier-vscode`
- Check settings: Prettier should be default formatter
- Try: `Ctrl+Shift+P` → "Format Document"

### Python venv not detected
- Check: `which python` in terminal should show `venv/bin/python`
- If not: Close/reopen terminal
- Or: Run task "Activate Python venv"

### Debugging not working
- Ensure project is built: `Ctrl+Shift+B`
- Check source maps are generated in `dist/`
- Verify no build errors in terminal

### Tasks not visible
- `Ctrl+Shift+P` → "Tasks: Run Task"
- If empty: Reload window

## Customization

### Personal Settings Override
Create `.vscode/settings.local.json`:
```json
{
  "editor.fontSize": 14,
  "terminal.integrated.fontSize": 12
}
```
This file is gitignored and won't be committed.

### Additional Tasks
Edit `.vscode/tasks.json` and add your own tasks.

### Custom Keybindings
`File` → `Preferences` → `Keyboard Shortcuts` → Search for task/command → Set binding

## Resources

- [VS Code Tasks Documentation](https://code.visualstudio.com/docs/editor/tasks)
- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [Electron Debugging](https://www.electronjs.org/docs/latest/tutorial/debugging-vscode)
