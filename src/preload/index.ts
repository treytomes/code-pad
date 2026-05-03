// Electron Preload Script - Context Bridge
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Example: Ping/Pong test
  ping: () => 'pong',

  // System information
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },

  // Execute C# code
  executeCode: (code: string, options?: { timeout?: number; queryType?: string }) =>
    ipcRenderer.invoke('execute-code', code, options),

  // Stop running execution
  stopExecution: () => ipcRenderer.invoke('stop-execution'),

  // Check runtime requirements
  checkRuntime: () => ipcRenderer.invoke('check-runtime'),

  // Install dotnet-script
  installDotnetScript: () => ipcRenderer.invoke('install-dotnet-script'),

  // Database location
  getDbPath: () => ipcRenderer.invoke('get-db-path'),
  setDbPath: () => ipcRenderer.invoke('set-db-path'),

  // Listen for background auto-install result
  onDotnetScriptInstallResult: (
    callback: (result: { success: boolean; output?: string; error?: string }) => void
  ) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      result: { success: boolean; output?: string; error?: string }
    ) => callback(result);
    ipcRenderer.on('dotnet-script-install-result', listener);
    return () => ipcRenderer.removeListener('dotnet-script-install-result', listener);
  },

  // Import/Export
  exportSnippet: (snippetName: string, code: string) =>
    ipcRenderer.invoke('export-snippet', snippetName, code),
  importSnippet: () => ipcRenderer.invoke('import-snippet'),
  exportAllSnippets: (snippets: any[]) => ipcRenderer.invoke('export-all-snippets', snippets),

  // Subscribe to output chunks during execution
  onOutputChunk: (callback: (chunk: string, isError: boolean) => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      data: { chunk: string; isError: boolean }
    ) => {
      callback(data.chunk, data.isError);
    };
    ipcRenderer.on('execution-output-chunk', listener);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('execution-output-chunk', listener);
    };
  },

  // Menu event listeners
  onMenuEvent: (event: string, callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on(event, listener);
    return () => {
      ipcRenderer.removeListener(event, listener);
    };
  },

  // Database operations
  db: {
    createSnippet: (snippet: {
      name: string;
      language: string;
      code: string;
      queryType?: string;
    }) => ipcRenderer.invoke('db-create-snippet', snippet),

    getSnippet: (id: string) => ipcRenderer.invoke('db-get-snippet', id),

    updateSnippet: (id: string, updates: { name?: string; code?: string; queryType?: string }) =>
      ipcRenderer.invoke('db-update-snippet', id, updates),

    deleteSnippet: (id: string) => ipcRenderer.invoke('db-delete-snippet', id),

    listSnippets: (language?: string) => ipcRenderer.invoke('db-list-snippets', language),

    incrementExecution: (id: string) => ipcRenderer.invoke('db-increment-execution', id),

    toggleStarred: (id: string) => ipcRenderer.invoke('db-toggle-starred', id),

    updateLastOpened: (id: string) => ipcRenderer.invoke('db-update-last-opened', id),

    getStarredSnippets: () => ipcRenderer.invoke('db-get-starred-snippets'),

    getRecentlyOpened: (limit?: number) => ipcRenderer.invoke('db-get-recently-opened', limit),
  },
});
