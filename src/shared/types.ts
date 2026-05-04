// Shared TypeScript types

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
