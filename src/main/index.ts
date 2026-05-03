// Electron Main Process
import * as electron from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { CSharpExecutor } from '../backend/executors/csharp';
import { SnippetDatabase } from '../backend/database';
import { checkRuntimeRequirements, RuntimeInfo } from '../backend/runtime-checker';
import {
  exportSnippetToFile,
  importSnippetFromFile,
  exportAllSnippets,
} from '../backend/import-export';
import { createApplicationMenu } from './menu';
import { logInfo, logError, logWarn, logDebug } from '../shared/logger';
import type { QueryType } from '../shared/types';

const execFileAsync = promisify(execFile);

interface InstallResult {
  success: boolean;
  output?: string;
  error?: string;
}

async function runInstallDotnetScript(): Promise<InstallResult> {
  try {
    const { stdout } = await execFileAsync('dotnet', ['tool', 'install', '-g', 'dotnet-script']);
    logInfo('dotnet-script installed successfully');
    return { success: true, output: stdout };
  } catch (error: unknown) {
    const err = error as { stderr?: string; message?: string };
    const errorMsg = err.stderr || err.message || String(error);
    logError('Failed to install dotnet-script', error);
    return { success: false, error: errorMsg };
  }
}

let mainWindow: electron.BrowserWindow | null = null;
const csharpExecutor = new CSharpExecutor();
let snippetDb: SnippetDatabase;

// App settings (separate from window state)
interface AppSettings {
  dbPath?: string;
}

function getAppSettingsPath(): string {
  return path.join(electron.app.getPath('userData'), 'app-settings.json');
}

function loadAppSettings(): AppSettings {
  try {
    const settingsPath = getAppSettingsPath();
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
  } catch (_e) {
    // Ignore — use defaults
  }
  return {};
}

function saveAppSettings(settings: AppSettings): void {
  try {
    fs.writeFileSync(getAppSettingsPath(), JSON.stringify(settings, null, 2), 'utf8');
  } catch (error) {
    logError('Failed to save app settings', error);
  }
}

// Window state management
interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized: boolean;
}

const defaultWindowState: WindowState = {
  width: 1200,
  height: 800,
  isMaximized: false,
};

function getWindowStatePath(): string {
  return path.join(electron.app.getPath('userData'), 'window-state.json');
}

function loadWindowState(): WindowState {
  try {
    const statePath = getWindowStatePath();
    if (fs.existsSync(statePath)) {
      const data = fs.readFileSync(statePath, 'utf8');
      const state = JSON.parse(data);

      // Validate and clamp dimensions
      const validatedState = validateWindowBounds({
        ...defaultWindowState,
        ...state,
      });

      logDebug('Loaded window state', validatedState);
      return validatedState;
    }
  } catch (error) {
    logWarn('Failed to load window state, using defaults', error);
  }
  return defaultWindowState;
}

function validateWindowBounds(state: WindowState): WindowState {
  const { screen } = electron;

  // Minimum sane window size
  const MIN_WIDTH = 800;
  const MIN_HEIGHT = 600;

  // Clamp dimensions to minimum values
  let width = Math.max(state.width, MIN_WIDTH);
  let height = Math.max(state.height, MIN_HEIGHT);

  // Check if position is specified
  if (state.x !== undefined && state.y !== undefined) {
    const displays = screen.getAllDisplays();
    const windowBounds = {
      x: state.x,
      y: state.y,
      width,
      height,
    };

    // Check if window intersects with any display
    const isVisible = displays.some((display) => {
      const { x, y, width: dWidth, height: dHeight } = display.bounds;
      // Check if any part of the window is visible on this display
      return (
        windowBounds.x < x + dWidth &&
        windowBounds.x + windowBounds.width > x &&
        windowBounds.y < y + dHeight &&
        windowBounds.y + windowBounds.height > y
      );
    });

    if (!isVisible) {
      // Window is off-screen, reset to primary display
      const primaryDisplay = screen.getPrimaryDisplay();
      const { x, y, width: dWidth, height: dHeight } = primaryDisplay.workArea;

      logWarn('Window bounds off-screen, resetting to primary display');

      return {
        width,
        height,
        x: x + Math.floor((dWidth - width) / 2),
        y: y + Math.floor((dHeight - height) / 2),
        isMaximized: state.isMaximized,
      };
    }
  }

  return {
    ...state,
    width,
    height,
  };
}

function saveWindowState(state: WindowState): void {
  try {
    const statePath = getWindowStatePath();
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
    logDebug('Saved window state', state);
  } catch (error) {
    logError('Failed to save window state', error);
  }
}

function getCurrentWindowState(): WindowState | null {
  if (!mainWindow) return null;

  const bounds = mainWindow.getBounds();
  const isMaximized = mainWindow.isMaximized();

  return {
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    isMaximized,
  };
}

function saveCurrentWindowState(): void {
  const state = getCurrentWindowState();
  if (state) {
    // Don't save size when maximized - use the pre-maximized size
    if (!state.isMaximized) {
      saveWindowState(state);
    } else {
      // Just save the maximized flag
      const currentSaved = loadWindowState();
      saveWindowState({ ...currentSaved, isMaximized: true });
    }
  }
}

// Initialize database — use custom path from app settings if set
const appSettings = loadAppSettings();
try {
  snippetDb = new SnippetDatabase(appSettings.dbPath);
  logInfo('Database initialized successfully');
} catch (error) {
  logError('Failed to initialize database', error);
  electron.app.quit();
  throw error;
}

function createWindow() {
  logInfo('Creating main window');

  // Load saved window state
  const windowState = loadWindowState();

  mainWindow = new electron.BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    icon: path.join(__dirname, '../../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Restore maximized state
  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    logInfo(`Loading dev server: ${process.env.VITE_DEV_SERVER_URL}`);
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    const htmlPath = path.join(__dirname, '../renderer/index.html');
    logInfo(`Loading app from file: ${htmlPath}`);
    mainWindow.loadFile(htmlPath);
  }

  // Save window state on resize/move/maximize
  let saveStateTimeout: NodeJS.Timeout | null = null;
  const debouncedSaveState = () => {
    if (saveStateTimeout) {
      clearTimeout(saveStateTimeout);
    }
    saveStateTimeout = setTimeout(() => {
      saveCurrentWindowState();
    }, 500); // Debounce by 500ms to avoid excessive writes
  };

  mainWindow.on('resize', debouncedSaveState);
  mainWindow.on('move', debouncedSaveState);
  mainWindow.on('maximize', () => {
    const state = loadWindowState();
    saveWindowState({ ...state, isMaximized: true });
  });
  mainWindow.on('unmaximize', () => {
    const state = getCurrentWindowState();
    if (state) {
      saveWindowState({ ...state, isMaximized: false });
    }
  });

  // Save final state before closing
  mainWindow.on('close', () => {
    if (saveStateTimeout) {
      clearTimeout(saveStateTimeout);
    }
    saveCurrentWindowState();
  });

  mainWindow.on('closed', () => {
    logInfo('Main window closed');
    mainWindow = null;
  });

  // Create application menu
  createApplicationMenu(mainWindow);
}

// IPC Handlers
electron.ipcMain.handle(
  'execute-code',
  async (event, code: string, options?: { timeout?: number; queryType?: QueryType }) => {
    logDebug('Execute code request received');
    try {
      const result = await csharpExecutor.execute(
        code,
        options,
        (chunk: string, isError: boolean) => {
          // Send output chunk to renderer
          event.sender.send('execution-output-chunk', { chunk, isError });
        }
      );
      logDebug(
        `Code execution completed: exitCode=${result.exitCode}, time=${result.executionTime}ms`
      );
      return result;
    } catch (error) {
      logError('Code execution failed', error);
      return {
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        exitCode: -1,
        executionTime: 0,
        timedOut: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
);

electron.ipcMain.handle('stop-execution', async () => {
  logInfo('Stop execution request received');
  csharpExecutor.stop();
  return { success: true };
});

// Database IPC Handlers
electron.ipcMain.handle('db-create-snippet', async (_event, snippet) => {
  return snippetDb.createSnippet(snippet);
});

electron.ipcMain.handle('db-get-snippet', async (_event, id: string) => {
  return snippetDb.getSnippet(id);
});

electron.ipcMain.handle('db-update-snippet', async (_event, id: string, updates) => {
  return snippetDb.updateSnippet(id, updates);
});

electron.ipcMain.handle('db-delete-snippet', async (_event, id: string) => {
  return snippetDb.deleteSnippet(id);
});

electron.ipcMain.handle('db-list-snippets', async (_event, language?: string) => {
  return snippetDb.listSnippets(language);
});

electron.ipcMain.handle('db-increment-execution', async (_event, id: string) => {
  return snippetDb.incrementExecutionCount(id);
});

// Toggle starred status
electron.ipcMain.handle('db-toggle-starred', async (_event, id: string) => {
  return snippetDb.toggleStarred(id);
});

// Update last opened timestamp
electron.ipcMain.handle('db-update-last-opened', async (_event, id: string) => {
  return snippetDb.updateLastOpened(id);
});

// Get starred snippets
electron.ipcMain.handle('db-get-starred-snippets', async () => {
  return snippetDb.getStarredSnippets();
});

// Get recently opened snippets
electron.ipcMain.handle('db-get-recently-opened', async (_event, limit?: number) => {
  return snippetDb.getRecentlyOpenedSnippets(limit);
});

// Check runtime requirements
electron.ipcMain.handle('check-runtime', async (): Promise<RuntimeInfo> => {
  return await checkRuntimeRequirements();
});

// Install dotnet-script global tool
electron.ipcMain.handle('install-dotnet-script', async (): Promise<InstallResult> => {
  return await runInstallDotnetScript();
});

// Database location handlers
electron.ipcMain.handle('get-db-path', (): string => {
  return appSettings.dbPath || path.join(os.homedir(), '.codepad', 'codepad.db');
});

electron.ipcMain.handle(
  'set-db-path',
  async (): Promise<{ success: boolean; path?: string; error?: string }> => {
    const defaultPath = appSettings.dbPath || path.join(os.homedir(), '.codepad', 'codepad.db');

    const result = await electron.dialog.showOpenDialog(mainWindow!, {
      title: 'Choose Database Location',
      defaultPath,
      properties: ['openFile', 'createDirectory', 'promptToCreate'],
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    });

    if (result.canceled || !result.filePaths[0]) {
      return { success: false, error: 'Canceled' };
    }

    const newPath = result.filePaths[0];

    try {
      // Copy existing DB to new location if it doesn't already exist there
      const currentPath = appSettings.dbPath || path.join(os.homedir(), '.codepad', 'codepad.db');
      if (newPath !== currentPath && fs.existsSync(currentPath) && !fs.existsSync(newPath)) {
        fs.mkdirSync(path.dirname(newPath), { recursive: true });
        fs.copyFileSync(currentPath, newPath);
        logInfo(`Copied database from ${currentPath} to ${newPath}`);
      }

      // Save new path and reopen database
      appSettings.dbPath = newPath;
      saveAppSettings(appSettings);

      snippetDb.close();
      snippetDb = new SnippetDatabase(newPath);
      logInfo(`Database relocated to ${newPath}`);

      return { success: true, path: newPath };
    } catch (error) {
      logError('Failed to relocate database', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
);

// Import/Export handlers
electron.ipcMain.handle('export-snippet', async (_event, snippetName: string, code: string) => {
  return await exportSnippetToFile(snippetName, code);
});

electron.ipcMain.handle('import-snippet', async () => {
  return await importSnippetFromFile();
});

electron.ipcMain.handle('export-all-snippets', async (_event, snippets: any[]) => {
  return await exportAllSnippets(snippets);
});

electron.app.whenReady().then(async () => {
  // Check runtime requirements on startup
  const runtimeInfo = await checkRuntimeRequirements();

  if (!runtimeInfo.hasDotnet || !runtimeInfo.hasDotnetScript) {
    logWarn('Runtime requirements not met, but continuing to launch app');
  }

  createWindow();

  // Auto-install dotnet-script silently if dotnet is present but dotnet-script is missing
  if (runtimeInfo.hasDotnet && !runtimeInfo.hasDotnetScript) {
    logInfo('dotnet-script missing — starting auto-install in background');
    runInstallDotnetScript().then((result) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('dotnet-script-install-result', result);
      }
    });
  }

  electron.app.on('activate', () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

electron.app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    electron.app.quit();
  }
});
