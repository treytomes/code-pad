# CodePad Logging

CodePad uses `electron-log` for comprehensive logging across the application.

## Log File Locations

Log files are automatically written to platform-specific locations:

### Windows
```
%USERPROFILE%\AppData\Roaming\codepad\logs\codepad.log
```
Example: `C:\Users\YourName\AppData\Roaming\codepad\logs\codepad.log`

### macOS
```
~/Library/Logs/codepad/codepad.log
```
Example: `/Users/YourName/Library/Logs/codepad/codepad.log`

### Linux
```
~/.config/codepad/logs/codepad.log
```
Example: `/home/yourname/.config/codepad/logs/codepad.log`

## Log Levels

The application logs at different levels:

- **ERROR**: Critical errors that need attention
- **WARN**: Warning messages about potential issues
- **INFO**: General information about application state
- **DEBUG**: Detailed debugging information

### Configuration

- **File logs**: INFO level and above
- **Console logs**: DEBUG level and above (development mode)
- **Log rotation**: Max 10MB per file, keeps 3 files
- **Format**: `[YYYY-MM-DD HH:MM:SS.mmm] [LEVEL] message`

## What Gets Logged

### Application Lifecycle
- Application start/stop
- Platform and version information
- Electron/Node/Chrome versions
- Log file location

### Database Operations
- Database initialization
- Migration execution
- Schema updates
- Connection errors

### Code Execution
- Execution requests
- Execution results (exit code, timing)
- Compilation errors
- Runtime errors
- Timeout events

### IPC Communication
- IPC handler calls
- Request/response logging
- IPC errors

### Errors
- Uncaught exceptions
- Unhandled promise rejections
- Stack traces with full context

## Viewing Logs

### During Development
Logs are printed to the console in addition to the file.

### In Production
Use the log file locations above. You can:

1. **Windows**: Open in Notepad
   ```
   notepad %APPDATA%\codepad\logs\codepad.log
   ```

2. **macOS**: Open in TextEdit or tail
   ```bash
   tail -f ~/Library/Logs/codepad/codepad.log
   ```

3. **Linux**: Use tail or any text editor
   ```bash
   tail -f ~/.config/codepad/logs/codepad.log
   ```

## Troubleshooting

If you encounter an issue:

1. **Find the log file** using the paths above
2. **Look for ERROR or WARN messages** around the time of the issue
3. **Check stack traces** for detailed error information
4. **Include relevant log excerpts** when reporting bugs

### Common Log Messages

**Database Migration**
```
[INFO] Checking for database migrations
[INFO] Running migration: Add starred column
[INFO] Migration completed: starred column added
```

**Code Execution**
```
[DEBUG] Starting C# code execution (timeout: 30000ms)
[DEBUG] Created temp file: /tmp/codepad-abc123.csx
[DEBUG] C# execution completed: exitCode=0, time=1234ms, timedOut=false
```

**Errors**
```
[ERROR] Failed to open database
[ERROR] {
  "message": "unable to open database file",
  "stack": "Error: unable to open database file\n    at ...",
  "name": "Error"
}
```

## Log Retention

- Logs rotate automatically when they reach 10MB
- Up to 3 log files are kept (codepad.log, codepad.log.1, codepad.log.2)
- Older logs are automatically deleted

## Privacy

Logs may contain:
- File paths
- Code snippet names
- Execution timing
- Error messages

Logs **DO NOT** contain:
- Your code content
- Personal data
- Credentials
- API keys

It's safe to share log files when reporting issues.

## Disabling Logs

To disable file logging (not recommended):

Edit `src/shared/logger.ts` and set:
```typescript
log.transports.file.level = false;
```

## Development

When developing CodePad:

- Logs appear in both console and file
- Use `logDebug()` for verbose debugging
- Use `logInfo()` for state changes
- Use `logWarn()` for potential issues
- Use `logError()` for errors with full context

Example:
```typescript
import { logInfo, logError } from '../shared/logger';

logInfo('Starting operation');
try {
  // do something
} catch (error) {
  logError('Operation failed', error);
}
```
