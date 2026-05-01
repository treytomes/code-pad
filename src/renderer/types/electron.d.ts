import { ExecutionResult } from '../../backend/executors/csharp';
import { Snippet } from '../../backend/database';

export interface ElectronAPI {
  ping: () => string;
  executeCode: (
    code: string,
    options?: { timeout?: number }
  ) => Promise<ExecutionResult>;
  db: {
    createSnippet: (snippet: {
      name: string;
      language: string;
      code: string;
    }) => Promise<Snippet>;
    getSnippet: (id: string) => Promise<Snippet | null>;
    updateSnippet: (
      id: string,
      updates: { name?: string; code?: string }
    ) => Promise<boolean>;
    deleteSnippet: (id: string) => Promise<boolean>;
    listSnippets: (language?: string) => Promise<Snippet[]>;
    incrementExecution: (id: string) => Promise<boolean>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
