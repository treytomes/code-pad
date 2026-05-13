import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';
import type { QueryType, NuGetReference, LocalAssemblyReference } from '../shared/types';

// Import logger - but make it optional for tests
let logInfo: (msg: string, ...args: any[]) => void = console.log;
let logError: (msg: string, error?: any) => void = console.error;
let _logWarn: (msg: string, ...args: any[]) => void = console.warn;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const logger = require('../shared/logger');
  logInfo = logger.logInfo;
  logError = logger.logError;
  _logWarn = logger.logWarn;
} catch (_e) {
  // Logger not available (e.g., in tests), use console
}

export interface Snippet {
  id: string;
  name: string;
  language: string;
  code: string;
  queryType: QueryType;
  usings: string[];
  references: NuGetReference[];
  localReferences: LocalAssemblyReference[];
  tags: string[];
  createdAt: number;
  modifiedAt: number;
  executionCount: number;
  starred: boolean;
  lastOpenedAt: number | null;
}

export class SnippetDatabase {
  private db: Database.Database;

  constructor(dbPath?: string) {
    // Default path: ~/.codepad/codepad.db
    const defaultPath = join(homedir(), '.codepad', 'codepad.db');
    const path = dbPath || defaultPath;

    logInfo(`Initializing database at: ${path}`);

    // Create directory if needed
    const dir = join(path, '..');
    if (!existsSync(dir)) {
      logInfo(`Creating database directory: ${dir}`);
      mkdirSync(dir, { recursive: true });
    }

    try {
      // Open database
      this.db = new Database(path);
      this.db.pragma('journal_mode = WAL'); // Better concurrency
      logInfo('Database opened successfully');

      // Initialize schema
      this.initializeSchema();

      // Run migrations
      this.runMigrations();
    } catch (error) {
      logError('Failed to open database', error);
      throw error;
    }
  }

  private initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS snippets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        language TEXT NOT NULL,
        code TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        modified_at INTEGER NOT NULL,
        execution_count INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_snippets_language
        ON snippets(language);

      CREATE INDEX IF NOT EXISTS idx_snippets_modified
        ON snippets(modified_at DESC);
    `);
  }

  private runMigrations() {
    try {
      logInfo('Checking for database migrations');

      const tableInfo = this.db.prepare('PRAGMA table_info(snippets)').all() as any[];
      const hasStarred = tableInfo.some((col) => col.name === 'starred');
      const hasLastOpened = tableInfo.some((col) => col.name === 'last_opened_at');
      const hasQueryType = tableInfo.some((col) => col.name === 'query_type');
      const hasUsings = tableInfo.some((col) => col.name === 'usings');
      const hasReferences = tableInfo.some((col) => col.name === 'nuget_references');
      const hasTags = tableInfo.some((col) => col.name === 'tags');
      const hasLocalReferences = tableInfo.some((col) => col.name === 'local_references');

      let ranAny = false;

      // Migration 1: Add starred column
      if (!hasStarred) {
        logInfo('Running migration: Add starred column');
        this.db.exec(`
          ALTER TABLE snippets ADD COLUMN starred INTEGER DEFAULT 0;
          CREATE INDEX IF NOT EXISTS idx_snippets_starred
            ON snippets(starred DESC, modified_at DESC);
        `);
        logInfo('Migration completed: starred column added');
        ranAny = true;
      }

      // Migration 2: Add last_opened_at column
      if (!hasLastOpened) {
        logInfo('Running migration: Add last_opened_at column');
        this.db.exec(`
          ALTER TABLE snippets ADD COLUMN last_opened_at INTEGER;
          CREATE INDEX IF NOT EXISTS idx_snippets_last_opened
            ON snippets(last_opened_at DESC);
        `);
        logInfo('Migration completed: last_opened_at column added');
        ranAny = true;
      }

      // Migration 3: Add query_type column (defaults to 'statements' for existing snippets)
      if (!hasQueryType) {
        logInfo('Running migration: Add query_type column');
        this.db.exec(`
          ALTER TABLE snippets ADD COLUMN query_type TEXT NOT NULL DEFAULT 'statements';
        `);
        logInfo('Migration completed: query_type column added');
        ranAny = true;
      }

      // Migration 4: Add usings and references columns (per-script script properties)
      if (!hasUsings) {
        logInfo('Running migration: Add usings column');
        this.db.exec(`ALTER TABLE snippets ADD COLUMN usings TEXT NOT NULL DEFAULT '[]';`);
        logInfo('Migration completed: usings column added');
        ranAny = true;
      }

      if (!hasReferences) {
        logInfo('Running migration: Add nuget_references column');
        this.db.exec(`ALTER TABLE snippets ADD COLUMN nuget_references TEXT NOT NULL DEFAULT '[]';`);
        logInfo('Migration completed: nuget_references column added');
        ranAny = true;
      }

      // Migration 5: Add tags column
      if (!hasTags) {
        logInfo('Running migration: Add tags column');
        this.db.exec(`ALTER TABLE snippets ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';`);
        logInfo('Migration completed: tags column added');
        ranAny = true;
      }

      // Migration 6: Add local_references column
      if (!hasLocalReferences) {
        logInfo('Running migration: Add local_references column');
        this.db.exec(`ALTER TABLE snippets ADD COLUMN local_references TEXT NOT NULL DEFAULT '[]';`);
        logInfo('Migration completed: local_references column added');
        ranAny = true;
      }

      logInfo(
        ranAny ? 'All database migrations completed successfully' : 'Database schema is up to date'
      );
    } catch (error) {
      logError('Migration failed', error);
      throw error;
    }
  }

  // Create
  createSnippet(
    snippet: Omit<
      Snippet,
      'id' | 'createdAt' | 'modifiedAt' | 'executionCount' | 'starred' | 'lastOpenedAt'
    >
  ): Snippet {
    const id = randomUUID();
    const now = Date.now();
    const queryType: QueryType = snippet.queryType ?? 'statements';
    const usings = JSON.stringify(snippet.usings ?? []);
    const references = JSON.stringify(snippet.references ?? []);
    const localReferences = JSON.stringify(snippet.localReferences ?? []);
    const tags = JSON.stringify(snippet.tags ?? []);

    const stmt = this.db.prepare(`
      INSERT INTO snippets (id, name, language, code, query_type, usings, nuget_references, local_references, tags, created_at, modified_at, execution_count, starred, last_opened_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NULL)
    `);

    stmt.run(id, snippet.name, snippet.language, snippet.code, queryType, usings, references, localReferences, tags, now, now);

    return {
      id,
      ...snippet,
      queryType,
      usings: snippet.usings ?? [],
      references: snippet.references ?? [],
      localReferences: snippet.localReferences ?? [],
      tags: snippet.tags ?? [],
      createdAt: now,
      modifiedAt: now,
      executionCount: 0,
      starred: false,
      lastOpenedAt: null,
    };
  }

  // Read
  getSnippet(id: string): Snippet | null {
    const stmt = this.db.prepare('SELECT * FROM snippets WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToSnippet(row);
  }

  // Update
  updateSnippet(
    id: string,
    updates: Partial<Pick<Snippet, 'name' | 'language' | 'code' | 'queryType' | 'usings' | 'references' | 'localReferences' | 'tags'>>
  ): boolean {
    const sets: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      sets.push('name = ?');
      values.push(updates.name);
    }

    if (updates.language !== undefined) {
      sets.push('language = ?');
      values.push(updates.language);
    }

    if (updates.code !== undefined) {
      sets.push('code = ?');
      values.push(updates.code);
    }

    if (updates.queryType !== undefined) {
      sets.push('query_type = ?');
      values.push(updates.queryType);
    }

    if (updates.usings !== undefined) {
      sets.push('usings = ?');
      values.push(JSON.stringify(updates.usings));
    }

    if (updates.references !== undefined) {
      sets.push('nuget_references = ?');
      values.push(JSON.stringify(updates.references));
    }

    if (updates.localReferences !== undefined) {
      sets.push('local_references = ?');
      values.push(JSON.stringify(updates.localReferences));
    }

    if (updates.tags !== undefined) {
      sets.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }

    if (sets.length === 0) return false;

    sets.push('modified_at = ?');
    values.push(Date.now());

    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE snippets
      SET ${sets.join(', ')}
      WHERE id = ?
    `);

    const result = stmt.run(...values);
    return result.changes > 0;
  }

  // Delete
  deleteSnippet(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM snippets WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // List
  listSnippets(language?: string, tag?: string): Snippet[] {
    let rows: any[];

    if (language && tag) {
      rows = this.db
        .prepare(`SELECT * FROM snippets WHERE language = ? AND tags LIKE ? ORDER BY modified_at DESC`)
        .all(language, `%"${tag}"%`);
    } else if (language) {
      rows = this.db
        .prepare('SELECT * FROM snippets WHERE language = ? ORDER BY modified_at DESC')
        .all(language);
    } else if (tag) {
      rows = this.db
        .prepare(`SELECT * FROM snippets WHERE tags LIKE ? ORDER BY modified_at DESC`)
        .all(`%"${tag}"%`);
    } else {
      rows = this.db.prepare('SELECT * FROM snippets ORDER BY modified_at DESC').all();
    }

    return rows.map(this.rowToSnippet.bind(this));
  }

  // Return sorted list of all unique tags across all snippets
  getAllTags(): string[] {
    const rows = this.db.prepare('SELECT tags FROM snippets WHERE tags != \'[]\'').all() as any[];
    const tagSet = new Set<string>();
    for (const row of rows) {
      try {
        const tags: string[] = JSON.parse(row.tags || '[]');
        tags.forEach((t) => tagSet.add(t));
      } catch (_e) { /* skip */ }
    }
    return Array.from(tagSet).sort();
  }

  // Increment execution count
  incrementExecutionCount(id: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE snippets
      SET execution_count = execution_count + 1
      WHERE id = ?
    `);

    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Toggle starred status
  toggleStarred(id: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE snippets
      SET starred = CASE WHEN starred = 0 THEN 1 ELSE 0 END
      WHERE id = ?
    `);

    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Update last opened timestamp
  updateLastOpened(id: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE snippets
      SET last_opened_at = ?
      WHERE id = ?
    `);

    const result = stmt.run(Date.now(), id);
    return result.changes > 0;
  }

  // Get starred snippets
  getStarredSnippets(): Snippet[] {
    const stmt = this.db.prepare(`
      SELECT * FROM snippets
      WHERE starred = 1
      ORDER BY modified_at DESC
    `);

    return stmt.all().map(this.rowToSnippet.bind(this));
  }

  // Get recently opened snippets
  getRecentlyOpenedSnippets(limit: number = 5): Snippet[] {
    const stmt = this.db.prepare(`
      SELECT * FROM snippets
      WHERE last_opened_at IS NOT NULL
      ORDER BY last_opened_at DESC
      LIMIT ?
    `);

    return stmt.all(limit).map(this.rowToSnippet.bind(this));
  }

  private rowToSnippet(row: any): Snippet {
    let usings: string[] = [];
    let references: NuGetReference[] = [];
    let localReferences: LocalAssemblyReference[] = [];
    let tags: string[] = [];
    try { usings = JSON.parse(row.usings || '[]'); } catch (_e) { /* keep empty */ }
    try { references = JSON.parse(row.nuget_references || '[]'); } catch (_e) { /* keep empty */ }
    try { localReferences = JSON.parse(row.local_references || '[]'); } catch (_e) { /* keep empty */ }
    try { tags = JSON.parse(row.tags || '[]'); } catch (_e) { /* keep empty */ }

    return {
      id: row.id,
      name: row.name,
      language: row.language,
      code: row.code,
      queryType: (row.query_type as QueryType) ?? 'statements',
      usings,
      references,
      localReferences,
      tags,
      createdAt: row.created_at,
      modifiedAt: row.modified_at,
      executionCount: row.execution_count,
      starred: row.starred === 1,
      lastOpenedAt: row.last_opened_at,
    };
  }

  close() {
    this.db.close();
  }
}
