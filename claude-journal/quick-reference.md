# Quick Reference - CodePad Development

## Project Status

**Phase**: 0 (Foundation) - Week 1 Complete  
**Next**: Phase 0 Week 2 - C# Execution & Database PoCs  
**Blocker**: Electron GUI doesn't work in WSL (use Windows instead)

## Critical Facts

1. **Build works perfectly** ✅
2. **Electron broken in WSL** ❌ (documented in ELECTRON-WSL-ISSUE.md)
3. **Backend development can continue** ✅
4. **VS Code fully configured** ✅
5. **All dependencies installed** ✅

## Quick Commands

```bash
# Activate Python venv first (for npm install)
source venv/bin/activate
export PYTHON="$(pwd)/venv/bin/python"

# Build
npm run build

# Test (GUI won't work in WSL)
npm run electron:dev

# On Windows (WILL work)
cd C:\Users\TreyTomes\projects\code-pad
npm run electron:dev
```

## Files to Check First

1. `ELECTRON-WSL-ISSUE.md` - Why GUI doesn't work
2. `PROJECT-PLAN.md` - Next tasks (Phase 0 Week 2)
3. `claude-journal/2026-05-01-session-summary.md` - Full session notes

## Next Tasks (Phase 0 Week 2)

### C# Execution PoC
- Install: `dotnet tool install -g dotnet-script`
- Create: `src/backend/executors/csharp.ts`
- Test: Execute simple C# code via `dotnet script`

### Database PoC
- Create: `src/backend/database.ts`
- Use: better-sqlite3 (already installed)
- Schema: snippets, tags, settings

## Git Status

Last commit: `bc5d6f7 - Fix module format issues and document Electron/WSL blocker`  
Branch: `main`  
All changes committed ✅

## Important Paths

- **Project Root**: `/home/trey/projects/code-pad`
- **Windows Copy**: `/mnt/c/Users/TreyTomes/projects/code-pad` (after copy)
- **Node**: `/home/trey/.nvm/versions/node/v22.11.0/bin/node`
- **Python venv**: `./venv/bin/python` (3.11.13)

## Dependencies Installed

- React 19.2.5
- Electron 30.0.0 (downgraded for testing, can upgrade)
- Monaco Editor 0.55.1
- Ant Design 6.3.7
- better-sqlite3 9.6.0 ✅
- TypeScript 6.0.3
- Vite 6.4.2
- All dev tools (ESLint, Prettier, Vitest, Playwright)

## Known Issues

1. **Electron module loading broken in WSL** - Use Windows for GUI
2. **better-sqlite3** - Requires Python 3.11 venv (already set up ✅)
3. **TypeScript warnings** - Deprecation warnings, can ignore
4. **Vite CJS warning** - Can ignore, just a warning

## Session Completed

✅ Project initialized  
✅ Build system working  
✅ VS Code configured  
✅ WSLg set up  
✅ All documentation written  
✅ Git repository clean  
❌ Electron GUI (WSL issue, use Windows)

**Ready for Phase 0 Week 2 backend development!**
