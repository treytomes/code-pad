import { ExecutionResult } from '../../backend/executors/csharp';
import { Snippet } from '../../backend/database';

export interface ElectronAPI {
  ping: () => string;

  versions: {
    electron: string;
    chrome: string;
    node: string;
  };

  executeCode: (code: string, options?: { timeout?: number }) => Promise<ExecutionResult>;

  stopExecution: () => Promise<void>;

  checkRuntime: () => Promise<{
    hasDotnet: boolean;
    hasDotnetScript: boolean;
    dotnetVersion?: string;
    dotnetScriptVersion?: string;
    error?: string;
  }>;

  exportSnippet: (snippetName: string, code: string) => Promise<any>;
  importSnippet: () => Promise<any>;
  exportAllSnippets: (snippets: any[]) => Promise<any>;

  onOutputChunk: (callback: (chunk: string, isError: boolean) => void) => () => void;

  onMenuEvent: (event: string, callback: () => void) => () => void;

  logger?: {
    info: (message: string) => void;
    error: (message: string, error?: any) => void;
  };

  db: {
    createSnippet: (snippet: { name: string; language: string; code: string }) => Promise<Snippet>;
    getSnippet: (id: string) => Promise<Snippet | null>;
    updateSnippet: (id: string, updates: { name?: string; code?: string }) => Promise<boolean>;
    deleteSnippet: (id: string) => Promise<boolean>;
    listSnippets: (language?: string) => Promise<Snippet[]>;
    incrementExecution: (id: string) => Promise<boolean>;
    toggleStarred: (id: string) => Promise<boolean>;
    getStarredSnippets: () => Promise<Snippet[]>;
    getRecentlyOpened: (limit: number) => Promise<Snippet[]>;
    updateLastOpened: (id: string) => Promise<boolean>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
