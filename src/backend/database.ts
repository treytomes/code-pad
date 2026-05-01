import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';

// Import logger - but make it optional for tests
let logInfo: (msg: string, ...args: any[]) => void = console.log;
let logError: (msg: string, error?: any) => void = console.error;
let logWarn: (msg: string, ...args: any[]) => void = console.warn;

try {
  const logger = require('../shared/logger');
  logInfo = logger.logInfo;
  logError = logger.logError;
  logWarn = logger.logWarn;
} catch (e) {
  // Logger not available (e.g., in tests), use console
}

export interface Snippet {
  id: string;
  name: string;
  language: string;
  code: string;
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

      // Check if starred column exists
      const tableInfo = this.db.prepare("PRAGMA table_info(snippets)").all() as any[];
      const hasStarred = tableInfo.some(col => col.name === 'starred');
      const hasLastOpened = tableInfo.some(col => col.name === 'last_opened_at');

      // Migration 1: Add starred column
      if (!hasStarred) {
        logInfo('Running migration: Add starred column');
        this.db.exec(`
          ALTER TABLE snippets ADD COLUMN starred INTEGER DEFAULT 0;
          CREATE INDEX IF NOT EXISTS idx_snippets_starred
            ON snippets(starred DESC, modified_at DESC);
        `);
        logInfo('Migration completed: starred column added');
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
      }

      if (!hasStarred || !hasLastOpened) {
        logInfo('All database migrations completed successfully');
      } else {
        logInfo('Database schema is up to date');
      }
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

    const stmt = this.db.prepare(`
      INSERT INTO snippets (id, name, language, code, created_at, modified_at, execution_count, starred, last_opened_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, NULL)
    `);

    stmt.run(id, snippet.name, snippet.language, snippet.code, now, now);

    return {
      id,
      ...snippet,
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
    updates: Partial<Pick<Snippet, 'name' | 'code'>>
  ): boolean {
    const sets: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      sets.push('name = ?');
      values.push(updates.name);
    }

    if (updates.code !== undefined) {
      sets.push('code = ?');
      values.push(updates.code);
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
  listSnippets(language?: string): Snippet[] {
    let stmt;

    if (language) {
      stmt = this.db.prepare(
        'SELECT * FROM snippets WHERE language = ? ORDER BY modified_at DESC'
      );
      return stmt.all(language).map(this.rowToSnippet);
    } else {
      stmt = this.db.prepare(
        'SELECT * FROM snippets ORDER BY modified_at DESC'
      );
      return stmt.all().map(this.rowToSnippet);
    }
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

    return stmt.all().map(this.rowToSnippet);
  }

  // Get recently opened snippets
  getRecentlyOpenedSnippets(limit: number = 5): Snippet[] {
    const stmt = this.db.prepare(`
      SELECT * FROM snippets
      WHERE last_opened_at IS NOT NULL
      ORDER BY last_opened_at DESC
      LIMIT ?
    `);

    return stmt.all(limit).map(this.rowToSnippet);
  }

  private rowToSnippet(row: any): Snippet {
    return {
      id: row.id,
      name: row.name,
      language: row.language,
      code: row.code,
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
