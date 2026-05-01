/**
 * Centralized logging for CodePad
 *
 * Uses electron-log which automatically writes to:
 * - Windows: %USERPROFILE%\AppData\Roaming\codepad\logs\main.log
 * - macOS: ~/Library/Logs/codepad/main.log
 * - Linux: ~/.config/codepad/logs/main.log
 */

import log from 'electron-log';
import { app } from 'electron';

// Configure log levels
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// Set log file name
log.transports.file.fileName = 'codepad.log';

// Add timestamp format
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
log.transports.console.format = '[{h}:{i}:{s}.{ms}] [{level}] {text}';

// Log rotation (max 10MB, keep 3 files)
log.transports.file.maxSize = 10 * 1024 * 1024;

// Log application start
if (app) {
  log.info('='.repeat(60));
  log.info(`CodePad started - v${app.getVersion()}`);
  log.info(`Platform: ${process.platform}`);
  log.info(`Arch: ${process.arch}`);
  log.info(`Electron: ${process.versions.electron}`);
  log.info(`Node: ${process.versions.node}`);
  log.info(`Chrome: ${process.versions.chrome}`);
  log.info(`Log file: ${log.transports.file.getFile().path}`);
  log.info('='.repeat(60));
}

// Export logger
export const logger = log;

// Export convenience functions
export const logInfo = (message: string, ...args: any[]) => log.info(message, ...args);
export const logError = (message: string, error?: Error | any) => {
  if (error instanceof Error) {
    log.error(message, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  } else if (error) {
    log.error(message, error);
  } else {
    log.error(message);
  }
};
export const logWarn = (message: string, ...args: any[]) => log.warn(message, ...args);
export const logDebug = (message: string, ...args: any[]) => log.debug(message, ...args);

// Catch unhandled errors
process.on('uncaughtException', (error) => {
  logError('Uncaught exception', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled promise rejection', reason);
});

export default logger;
