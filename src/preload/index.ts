// Electron Preload Script - Context Bridge
import { contextBridge } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Example: Ping/Pong test
  ping: () => 'pong',
});
