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
});
