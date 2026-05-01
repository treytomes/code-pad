// Shared TypeScript types

// Electron API exposed to renderer
export interface ElectronAPI {
  ping: () => string;
}

// Extend the Window interface to include our custom electronAPI
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
