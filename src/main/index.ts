// Electron Main Process
import * as electron from 'electron';
import * as path from 'path';
import { CSharpExecutor } from '../backend/executors/csharp';

let mainWindow: electron.BrowserWindow | null = null;
const csharpExecutor = new CSharpExecutor();

function createWindow() {
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
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
electron.ipcMain.handle(
  'execute-code',
  async (_event, code: string, options?: { timeout?: number }) => {
    try {
      const result = await csharpExecutor.execute(code, options);
      return result;
    } catch (error) {
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

electron.app.whenReady().then(() => {
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
