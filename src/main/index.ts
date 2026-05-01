// Electron Main Process
import * as electron from 'electron';
import * as path from 'path';
import { CSharpExecutor } from '../backend/executors/csharp';
import { SnippetDatabase } from '../backend/database';
import { checkRuntimeRequirements, RuntimeInfo } from '../backend/runtime-checker';
import { exportSnippetToFile, importSnippetFromFile, exportAllSnippets } from '../backend/import-export';
import { logger, logInfo, logError, logWarn, logDebug } from '../shared/logger';

let mainWindow: electron.BrowserWindow | null = null;
const csharpExecutor = new CSharpExecutor();
let snippetDb: SnippetDatabase;

// Initialize database with error handling
try {
  snippetDb = new SnippetDatabase();
  logInfo('Database initialized successfully');
} catch (error) {
  logError('Failed to initialize database', error);
  electron.app.quit();
  throw error;
}

function createWindow() {
  logInfo('Creating main window');
  mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

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

  mainWindow.on('closed', () => {
    logInfo('Main window closed');
    mainWindow = null;
  });
}

// IPC Handlers
electron.ipcMain.handle(
  'execute-code',
  async (event, code: string, options?: { timeout?: number }) => {
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
      logDebug(`Code execution completed: exitCode=${result.exitCode}, time=${result.executionTime}ms`);
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

// Database IPC Handlers
electron.ipcMain.handle('db-create-snippet', async (_event, snippet) => {
  return snippetDb.createSnippet(snippet);
});

electron.ipcMain.handle('db-get-snippet', async (_event, id: string) => {
  return snippetDb.getSnippet(id);
});

electron.ipcMain.handle(
  'db-update-snippet',
  async (_event, id: string, updates) => {
    return snippetDb.updateSnippet(id, updates);
  }
);

electron.ipcMain.handle('db-delete-snippet', async (_event, id: string) => {
  return snippetDb.deleteSnippet(id);
});

electron.ipcMain.handle('db-list-snippets', async (_event, language?: string) => {
  return snippetDb.listSnippets(language);
});

electron.ipcMain.handle(
  'db-increment-execution',
  async (_event, id: string) => {
    return snippetDb.incrementExecutionCount(id);
  }
);

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
