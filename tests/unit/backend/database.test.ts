import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SnippetDatabase } from '../../../src/backend/database';
import { unlinkSync, existsSync } from 'fs';

describe('SnippetDatabase', () => {
  const testDbPath = './test-codepad.db';
  let db: SnippetDatabase;

  beforeEach(() => {
    // Clean up old test DB
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
    if (existsSync(`${testDbPath}-shm`)) {
      unlinkSync(`${testDbPath}-shm`);
    }
    if (existsSync(`${testDbPath}-wal`)) {
      unlinkSync(`${testDbPath}-wal`);
    }

    db = new SnippetDatabase(testDbPath);
  });

  afterEach(() => {
    db.close();
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
    if (existsSync(`${testDbPath}-shm`)) {
      unlinkSync(`${testDbPath}-shm`);
    }
    if (existsSync(`${testDbPath}-wal`)) {
      unlinkSync(`${testDbPath}-wal`);
    }
  });

  describe('createSnippet', () => {
    it('should create a snippet with generated ID', () => {
      const snippet = db.createSnippet({
        name: 'Hello World',
        language: 'csharp',
        code: 'Console.WriteLine("Hello");',
      });

      expect(snippet.id).toBeDefined();
      expect(snippet.id.length).toBeGreaterThan(0);
      expect(snippet.name).toBe('Hello World');
      expect(snippet.language).toBe('csharp');
      expect(snippet.code).toContain('Hello');
      expect(snippet.createdAt).toBeGreaterThan(0);
      expect(snippet.modifiedAt).toBe(snippet.createdAt);
      expect(snippet.executionCount).toBe(0);
    });

    it('should create multiple snippets with unique IDs', () => {
      const snippet1 = db.createSnippet({
        name: 'Snippet 1',
        language: 'csharp',
        code: 'var x = 1;',
      });

      const snippet2 = db.createSnippet({
        name: 'Snippet 2',
        language: 'csharp',
        code: 'var x = 2;',
      });

      expect(snippet1.id).not.toBe(snippet2.id);
    });
  });

  describe('getSnippet', () => {
    it('should retrieve a snippet by ID', () => {
      const created = db.createSnippet({
        name: 'Test',
        language: 'csharp',
        code: 'var x = 5;',
      });

      const retrieved = db.getSnippet(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe('Test');
      expect(retrieved?.code).toBe('var x = 5;');
    });

    it('should return null for non-existent ID', () => {
      const result = db.getSnippet('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('updateSnippet', () => {
    it('should update snippet name', () => {
      const created = db.createSnippet({
        name: 'Old Name',
        language: 'csharp',
        code: 'var x = 1;',
      });

      const updated = db.updateSnippet(created.id, { name: 'New Name' });
      expect(updated).toBe(true);

      const retrieved = db.getSnippet(created.id);
      expect(retrieved?.name).toBe('New Name');
      expect(retrieved?.code).toBe('var x = 1;');
      expect(retrieved?.modifiedAt).toBeGreaterThanOrEqual(created.createdAt);
    });

    it('should update snippet code', () => {
      const created = db.createSnippet({
        name: 'Test',
        language: 'csharp',
        code: 'var x = 1;',
      });

      const updated = db.updateSnippet(created.id, { code: 'var x = 2;' });
      expect(updated).toBe(true);

      const retrieved = db.getSnippet(created.id);
      expect(retrieved?.code).toBe('var x = 2;');
    });

    it('should update both name and code', () => {
      const created = db.createSnippet({
        name: 'Test',
        language: 'csharp',
        code: 'var x = 1;',
      });

      const updated = db.updateSnippet(created.id, {
        name: 'Updated',
        code: 'var x = 99;',
      });
      expect(updated).toBe(true);

      const retrieved = db.getSnippet(created.id);
      expect(retrieved?.name).toBe('Updated');
      expect(retrieved?.code).toBe('var x = 99;');
    });

    it('should return false for non-existent ID', () => {
      const result = db.updateSnippet('non-existent', { name: 'Test' });
      expect(result).toBe(false);
    });

    it('should return false when no updates provided', () => {
      const created = db.createSnippet({
        name: 'Test',
        language: 'csharp',
        code: 'var x = 1;',
      });

      const result = db.updateSnippet(created.id, {});
      expect(result).toBe(false);
    });
  });

  describe('deleteSnippet', () => {
    it('should delete a snippet', () => {
      const created = db.createSnippet({
        name: 'To Delete',
        language: 'csharp',
        code: 'var x = 1;',
      });

      const deleted = db.deleteSnippet(created.id);
      expect(deleted).toBe(true);

      const retrieved = db.getSnippet(created.id);
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent ID', () => {
      const result = db.deleteSnippet('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('listSnippets', () => {
    it('should list all snippets', () => {
      db.createSnippet({
        name: 'Snippet 1',
        language: 'csharp',
        code: 'var x = 1;',
      });

      db.createSnippet({
        name: 'Snippet 2',
        language: 'python',
        code: 'x = 2',
      });

      const snippets = db.listSnippets();
      expect(snippets.length).toBe(2);
    });

    it('should filter snippets by language', () => {
      db.createSnippet({
        name: 'C# Snippet',
        language: 'csharp',
        code: 'var x = 1;',
      });

      db.createSnippet({
        name: 'Python Snippet',
        language: 'python',
        code: 'x = 2',
      });

      const csharpSnippets = db.listSnippets('csharp');
      expect(csharpSnippets.length).toBe(1);
      expect(csharpSnippets[0].name).toBe('C# Snippet');

      const pythonSnippets = db.listSnippets('python');
      expect(pythonSnippets.length).toBe(1);
      expect(pythonSnippets[0].name).toBe('Python Snippet');
    });

    it('should order snippets by most recently modified', () => {
      const snippet1 = db.createSnippet({
        name: 'First',
        language: 'csharp',
        code: 'var x = 1;',
      });

      const snippet2 = db.createSnippet({
        name: 'Second',
        language: 'csharp',
        code: 'var x = 2;',
      });

      // Update snippet1 so it becomes most recent
      db.updateSnippet(snippet1.id, { name: 'First Updated' });

      const snippets = db.listSnippets();
      expect(snippets[0].name).toBe('First Updated');
      expect(snippets[1].name).toBe('Second');
    });

    it('should return empty array when no snippets exist', () => {
      const snippets = db.listSnippets();
      expect(snippets).toEqual([]);
    });

    it('should return empty array when filtering by non-existent language', () => {
      db.createSnippet({
        name: 'C# Snippet',
        language: 'csharp',
        code: 'var x = 1;',
      });

      const snippets = db.listSnippets('rust');
      expect(snippets).toEqual([]);
    });
  });

  describe('incrementExecutionCount', () => {
    it('should increment execution count', () => {
      const snippet = db.createSnippet({
        name: 'Test',
        language: 'csharp',
        code: 'var x = 1;',
      });

      expect(snippet.executionCount).toBe(0);

      db.incrementExecutionCount(snippet.id);
      let retrieved = db.getSnippet(snippet.id);
      expect(retrieved?.executionCount).toBe(1);

      db.incrementExecutionCount(snippet.id);
      retrieved = db.getSnippet(snippet.id);
      expect(retrieved?.executionCount).toBe(2);
    });

    it('should return false for non-existent ID', () => {
      const result = db.incrementExecutionCount('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('database lifecycle', () => {
    it('should create database directory if not exists', () => {
      const customPath = './test-dir/test.db';

      // Clean up if exists
      if (existsSync('./test-dir')) {
        const fs = require('fs');
        fs.rmSync('./test-dir', { recursive: true });
      }

      const customDb = new SnippetDatabase(customPath);
      expect(existsSync(customPath)).toBe(true);

      customDb.close();

      // Clean up
      const fs = require('fs');
      fs.rmSync('./test-dir', { recursive: true });
    });

    it('should close database connection', () => {
      const snippet = db.createSnippet({
        name: 'Test',
        language: 'csharp',
        code: 'var x = 1;',
      });

      db.close();

      // After closing, database operations should fail
      expect(() => db.getSnippet(snippet.id)).toThrow();
    });
  });
});
