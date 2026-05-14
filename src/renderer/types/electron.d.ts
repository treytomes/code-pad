import { ExecutionResult } from '../../backend/executors/csharp';
import { Snippet, SnippetPackage } from '../../backend/database';
import { QueryType, NuGetReference, LocalAssemblyReference, ExecutionResult as PythonExecutionResult, PythonRuntimeInfo } from '../../shared/types';
import { VirtualEnvironmentInfo, PackageInstallResult } from '../../backend/pip-manager';

export interface ElectronAPI {
  ping: () => string;

  versions: {
    electron: string;
    chrome: string;
    node: string;
  };

  executeCode: (
    code: string,
    options?: { timeout?: number; queryType?: QueryType; usings?: string[]; references?: NuGetReference[]; localReferences?: LocalAssemblyReference[]; targetFramework?: string }
  ) => Promise<ExecutionResult>;

  stopExecution: () => Promise<void>;

  executePython: (code: string, options?: { timeout?: number }) => Promise<PythonExecutionResult>;
  stopPython: () => Promise<void>;
  checkPythonRuntime: (customPath?: string) => Promise<PythonRuntimeInfo>;

  // pip/venv management
  pipInstallPackages: (packages: string[]) => Promise<PackageInstallResult>;
  pipListInstalled: () => Promise<Record<string, string>>;
  venvGetInfo: () => Promise<VirtualEnvironmentInfo>;
  venvCreate: () => Promise<{ success: boolean; error?: string }>;

  checkRuntime: () => Promise<{
    hasDotnet: boolean;
    hasDotnetScript: boolean;
    dotnetVersion?: string;
    dotnetScriptVersion?: string;
    error?: string;
  }>;

  installDotnetScript: () => Promise<{ success: boolean; output?: string; error?: string }>;

  getDbPath: () => Promise<string>;
  setDbPath: () => Promise<{ success: boolean; path?: string; error?: string }>;
  getInstalledFrameworks: () => Promise<string[]>;

  onDotnetScriptInstallResult: (
    callback: (result: { success: boolean; output?: string; error?: string }) => void
  ) => () => void;

  exportSnippet: (snippetName: string, code: string) => Promise<any>;
  importSnippet: () => Promise<any>;
  exportAllSnippets: (snippets: any[]) => Promise<any>;

  onOutputChunk: (callback: (chunk: string, isError: boolean) => void) => () => void;
  onOutputDone: () => Promise<void>;

  onMenuEvent: (event: string, callback: () => void) => () => void;

  logger?: {
    info: (message: string) => void;
    error: (message: string, error?: any) => void;
  };

  db: {
    createSnippet: (snippet: {
      name: string;
      language: string;
      code: string;
      queryType?: QueryType;
      usings?: string[];
      references?: NuGetReference[];
      localReferences?: LocalAssemblyReference[];
      tags?: string[];
    }) => Promise<Snippet>;
    getSnippet: (id: string) => Promise<Snippet | null>;
    updateSnippet: (
      id: string,
      updates: { name?: string; language?: string; code?: string; queryType?: QueryType; usings?: string[]; references?: NuGetReference[]; localReferences?: LocalAssemblyReference[]; tags?: string[] }
    ) => Promise<boolean>;
    deleteSnippet: (id: string) => Promise<boolean>;
    listSnippets: (language?: string, tag?: string) => Promise<Snippet[]>;
    incrementExecution: (id: string) => Promise<boolean>;
    toggleStarred: (id: string) => Promise<boolean>;
    getStarredSnippets: () => Promise<Snippet[]>;
    getRecentlyOpened: (limit: number) => Promise<Snippet[]>;
    getAllTags: () => Promise<string[]>;
    updateLastOpened: (id: string) => Promise<boolean>;

    // Snippet packages (pip)
    getSnippetPackages: (snippetId: string) => Promise<SnippetPackage[]>;
    addSnippetPackage: (snippetId: string, packageName: string, packageVersion?: string) => Promise<SnippetPackage>;
    removeSnippetPackage: (snippetId: string, packageName: string) => Promise<void>;
    clearSnippetPackages: (snippetId: string) => Promise<void>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
