// Shared TypeScript types

export type Language = 'csharp' | 'python';

export type QueryType = 'expression' | 'statements' | 'program';

export interface NuGetReference {
  name: string;
  version: string;
}

export interface LocalAssemblyReference {
  path: string;
}

export interface ScriptProperties {
  usings: string[];
  references: NuGetReference[];
  localReferences: LocalAssemblyReference[];
}

export interface ExecutionOptions {
  timeout?: number; // Milliseconds (0 = disabled, undefined = default 30000)
  workingDirectory?: string;
  env?: Record<string, string>;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number; // Milliseconds
  error?: string;
}

export interface PythonRuntimeInfo {
  available: boolean;
  version?: string; // e.g., "3.11.5"
  path?: string; // e.g., "/usr/bin/python3"
  error?: string; // Error message if not available
}
