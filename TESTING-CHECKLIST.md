# CodePad Testing Checklist

## Pre-Build Verification

- [ ] All unit tests pass: `npm test`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] No linting errors: `npm run lint`
- [ ] Code is formatted: `npm run format:check`

## Build Production Version

```bash
# Build production package
npm run build:prod

# Or on Windows:
npm run clean:windows && npm run build && npm run electron:build

# Package location: ./release/
```

## Installation Testing

### Windows
- [ ] Install from `release/CodePad Setup X.X.X.exe`
- [ ] App launches successfully
- [ ] No installer errors
- [ ] Desktop shortcut created (if applicable)
- [ ] Start menu entry created

### macOS
- [ ] Install from `release/CodePad-X.X.X.dmg`
- [ ] Drag to Applications works
- [ ] App launches without Gatekeeper warnings (if signed)
- [ ] App appears in Launchpad

### Linux
- [ ] Install from `release/CodePad-X.X.X.AppImage`
- [ ] Make executable: `chmod +x CodePad-X.X.X.AppImage`
- [ ] App launches successfully
- [ ] Alternative: Test .deb package on Debian/Ubuntu

## Runtime Detection Testing

- [ ] **Fresh Install Test**: Uninstall .NET and dotnet-script
  - [ ] Launch CodePad
  - [ ] Runtime warning dialog appears
  - [ ] Dialog shows missing .NET SDK message
  - [ ] Dialog shows missing dotnet-script message
  - [ ] Installation links are clickable
  - [ ] Can dismiss dialog and continue

- [ ] **Partial Install Test**: Only .NET SDK installed
  - [ ] Dialog shows only dotnet-script missing
  - [ ] .NET version displayed as detected

- [ ] **Full Install Test**: Both components installed
  - [ ] No runtime warning appears
  - [ ] App launches normally

## Core Functionality Testing

### Snippet Management

- [ ] **Create New Snippet**
  - [ ] Click "New" button
  - [ ] Enter code in editor
  - [ ] Click "Save As..."
  - [ ] Enter snippet name
  - [ ] Snippet appears in sidebar

- [ ] **Open Snippet**
  - [ ] Click snippet in list
  - [ ] Code loads in editor
  - [ ] Output panel clears

- [ ] **Rename Snippet**
  - [ ] Click pencil icon on snippet
  - [ ] Enter new name
  - [ ] Click checkmark
  - [ ] Name updates in list

- [ ] **Delete Snippet**
  - [ ] Click delete icon
  - [ ] Confirm deletion
  - [ ] Snippet removed from list

- [ ] **Star/Unstar Snippet**
  - [ ] Click star icon
  - [ ] Snippet moves to "Starred" section
  - [ ] Click star again to unstar
  - [ ] Snippet moves back to "All Snippets"

### Code Execution

- [ ] **Basic Execution**
  - [ ] Enter simple C# code: `Console.WriteLine("Hello");`
  - [ ] Click "Run Code" or press F5
  - [ ] Output appears: "Hello"
  - [ ] Execution time displayed

- [ ] **Streaming Output**
  - [ ] Code with loop that prints multiple lines
  - [ ] Output appears line-by-line in real-time
  - [ ] No delay waiting for completion

- [ ] **Error Handling**
  - [ ] Code with syntax error
  - [ ] Error message appears in output
  - [ ] Error is readable and helpful

- [ ] **Timeout Handling**
  - [ ] Code with infinite loop: `while(true) {}`
  - [ ] Execution eventually times out
  - [ ] Timeout message displayed

### Search and Filter

- [ ] **Search by Name**
  - [ ] Enter text in search box
  - [ ] Snippet list filters in real-time
  - [ ] Starred/Recent/All sections all filter
  - [ ] Clear search shows all snippets again

- [ ] **Filter by Language**
  - [ ] Select "C#" from language dropdown
  - [ ] Only C# snippets shown
  - [ ] Clear filter shows all languages

- [ ] **Recently Opened**
  - [ ] Open several snippets
  - [ ] Check "Recently Opened" section
  - [ ] Most recent 5 snippets shown
  - [ ] Ordered by most recent first

### Import/Export

- [ ] **Export Single Snippet**
  - [ ] Select a snippet
  - [ ] Click "Export"
  - [ ] Choose save location
  - [ ] .cs file created with correct content

- [ ] **Import Snippet**
  - [ ] Click "Import"
  - [ ] Select a .cs file
  - [ ] New snippet created with file name
  - [ ] Code matches file content

- [ ] **Export All**
  - [ ] Click "Export All"
  - [ ] Choose save location
  - [ ] JSON file created
  - [ ] Contains all snippets with metadata
  - [ ] JSON is valid and readable

### Keyboard Shortcuts

- [ ] **Ctrl+N (New Snippet)**
  - [ ] Creates new untitled snippet
  - [ ] Editor clears

- [ ] **Ctrl+S (Save)**
  - [ ] Saves current snippet (if exists)
  - [ ] Shows save dialog (if new)

- [ ] **Ctrl+Shift+S (Save As)**
  - [ ] Opens save dialog
  - [ ] Creates duplicate with new name

- [ ] **F5 (Run Code)**
  - [ ] Executes current code
  - [ ] Works even when editor has focus

### UI/UX

- [ ] **Monaco Editor**
  - [ ] Syntax highlighting works
  - [ ] IntelliSense suggestions appear
  - [ ] Line numbers visible
  - [ ] Code folding works
  - [ ] Find/Replace (Ctrl+F) works

- [ ] **Resizable Panels**
  - [ ] Drag sidebar border to resize
  - [ ] Drag output panel top border to resize
  - [ ] Sizes persist during session

- [ ] **Output Panel**
  - [ ] Copy button copies output to clipboard
  - [ ] Clear button clears output
  - [ ] Output scrolls automatically
  - [ ] Execution time updates in real-time

- [ ] **Error Boundary**
  - [ ] (Manual test) Inject a React error
  - [ ] Error boundary catches it
  - [ ] User-friendly error message shown
  - [ ] "Try Again" and "Reload" buttons work

### About Dialog

- [ ] Click help (?) button in header
- [ ] About dialog opens
- [ ] Version number correct (0.1.0)
- [ ] Feature list displayed
- [ ] System info shows correct versions
- [ ] GitHub link opens in browser
- [ ] Can close dialog with X or outside click

## Logging

- [ ] **View Logs**
  ```bash
  npm run logs
  # or
  npm run logs:windows
  ```
  - [ ] Logs tail in real-time
  - [ ] Execution events logged
  - [ ] Errors logged with stack traces

- [ ] **Log Files Exist**
  - [ ] Check platform-specific log location:
    - Linux: `~/.config/codepad/logs/codepad.log`
    - macOS: `~/Library/Logs/codepad/codepad.log`
    - Windows: `%APPDATA%\codepad\logs\codepad.log`
  - [ ] Log contains app startup messages
  - [ ] Log rotation works (max 10MB per file)

## Database Persistence

- [ ] Create several snippets
- [ ] Close app completely
- [ ] Reopen app
- [ ] All snippets still present
- [ ] Starred status preserved
- [ ] Last opened order preserved

## Performance

- [ ] **Startup Time**
  - [ ] App launches in < 3 seconds

- [ ] **Large Snippet List**
  - [ ] Create 50+ snippets
  - [ ] List scrolls smoothly
  - [ ] Search remains responsive

- [ ] **Large Output**
  - [ ] Code that prints 1000+ lines
  - [ ] Output displays without freezing
  - [ ] Can scroll output smoothly

## Cross-Platform Testing

If testing on multiple platforms:

- [ ] Windows 10/11
- [ ] macOS (latest version)
- [ ] Linux (Ubuntu/Debian or Fedora/AlmaLinux)

Verify all core functionality works identically across platforms.

## Regression Testing

When new features are added, re-test:

- [ ] All existing functionality still works
- [ ] No new bugs introduced
- [ ] Performance hasn't degraded

## Bug Tracking

Document any issues found:

| Issue | Severity | Platform | Reproducible | Notes |
|-------|----------|----------|--------------|-------|
|       |          |          |              |       |

**Severity Levels:**
- **Critical**: App crashes, data loss
- **High**: Feature completely broken
- **Medium**: Feature partially broken
- **Low**: Minor UI issue, cosmetic

## Sign-Off

- [ ] All critical and high severity bugs fixed
- [ ] All core features working
- [ ] Documentation accurate
- [ ] Ready for release

**Tested by**: _______________  
**Date**: _______________  
**Version**: _______________  
**Platform(s)**: _______________
