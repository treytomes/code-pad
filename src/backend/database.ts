import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';

export interface Snippet {
  id: string;
  name: string;
  language: string;
  code: string;
  createdAt: number;
  modifiedAt: number;
  executionCount: number;
}

export class SnippetDatabase {
  private db: Database.Database;

  constructor(dbPath?: string) {
    // Default path: ~/.codepad/codepad.db
    const defaultPath = join(homedir(), '.codepad', 'codepad.db');
    const path = dbPath || defaultPath;

    // Create directory if needed
    const dir = join(path, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Open database
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL'); // Better concurrency

    // Initialize schema
    this.initializeSchema();
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

  // Create
  createSnippet(
    snippet: Omit<
      Snippet,
      'id' | 'createdAt' | 'modifiedAt' | 'executionCount'
    >
  ): Snippet {
    const id = randomUUID();
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO snippets (id, name, language, code, created_at, modified_at, execution_count)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `);

    stmt.run(id, snippet.name, snippet.language, snippet.code, now, now);

    return {
      id,
      ...snippet,
      createdAt: now,
      modifiedAt: now,
      executionCount: 0,
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

  private rowToSnippet(row: any): Snippet {
    return {
      id: row.id,
      name: row.name,
      language: row.language,
      code: row.code,
      createdAt: row.created_at,
      modifiedAt: row.modified_at,
      executionCount: row.execution_count,
    };
  }

  close() {
    this.db.close();
  }
}
