import { ExecutionResult } from '../../backend/executors/csharp';

export interface ElectronAPI {
  ping: () => string;
  executeCode: (
    code: string,
    options?: { timeout?: number }
  ) => Promise<ExecutionResult>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
