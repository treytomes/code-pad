// Electron Preload Script - Context Bridge
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Example: Ping/Pong test
  ping: () => 'pong',

  // Execute C# code
  executeCode: (code: string, options?: { timeout?: number }) =>
    ipcRenderer.invoke('execute-code', code, options),

  // Check runtime requirements
  checkRuntime: () => ipcRenderer.invoke('check-runtime'),

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

  // Database operations
  db: {
    createSnippet: (snippet: {
      name: string;
      language: string;
      code: string;
    }) => ipcRenderer.invoke('db-create-snippet', snippet),

    getSnippet: (id: string) => ipcRenderer.invoke('db-get-snippet', id),

    updateSnippet: (
      id: string,
      updates: { name?: string; code?: string }
    ) => ipcRenderer.invoke('db-update-snippet', id, updates),

    deleteSnippet: (id: string) =>
      ipcRenderer.invoke('db-delete-snippet', id),

    listSnippets: (language?: string) =>
      ipcRenderer.invoke('db-list-snippets', language),

    incrementExecution: (id: string) =>
      ipcRenderer.invoke('db-increment-execution', id),

    toggleStarred: (id: string) =>
      ipcRenderer.invoke('db-toggle-starred', id),

    updateLastOpened: (id: string) =>
      ipcRenderer.invoke('db-update-last-opened', id),

    getStarredSnippets: () =>
      ipcRenderer.invoke('db-get-starred-snippets'),

    getRecentlyOpened: (limit?: number) =>
      ipcRenderer.invoke('db-get-recently-opened', limit),
  },
});
