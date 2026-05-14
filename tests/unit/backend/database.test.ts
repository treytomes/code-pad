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

  describe('snippet packages', () => {
    it('should add a package to a snippet', () => {
      const snippet = db.createSnippet({
        name: 'Python Snippet',
        language: 'python',
        code: 'import requests',
      });

      const pkg = db.addSnippetPackage(snippet.id, 'requests', '>=2.0.0');

      expect(pkg.id).toBeGreaterThan(0);
      expect(pkg.snippetId).toBe(snippet.id);
      expect(pkg.packageName).toBe('requests');
      expect(pkg.packageVersion).toBe('>=2.0.0');
      expect(pkg.createdAt).toBeGreaterThan(0);
    });

    it('should add a package without version', () => {
      const snippet = db.createSnippet({
        name: 'Python Snippet',
        language: 'python',
        code: 'import numpy',
      });

      const pkg = db.addSnippetPackage(snippet.id, 'numpy');

      expect(pkg.packageName).toBe('numpy');
      expect(pkg.packageVersion).toBeUndefined();
    });

    it('should get all packages for a snippet', () => {
      const snippet = db.createSnippet({
        name: 'Python Snippet',
        language: 'python',
        code: 'import requests, numpy',
      });

      db.addSnippetPackage(snippet.id, 'requests', '>=2.0.0');
      db.addSnippetPackage(snippet.id, 'numpy', '>=1.20.0');

      const packages = db.getSnippetPackages(snippet.id);

      expect(packages.length).toBe(2);
      expect(packages[0].packageName).toBe('numpy');
      expect(packages[1].packageName).toBe('requests');
    });

    it('should return empty array for snippet with no packages', () => {
      const snippet = db.createSnippet({
        name: 'Python Snippet',
        language: 'python',
        code: 'print("hello")',
      });

      const packages = db.getSnippetPackages(snippet.id);

      expect(packages).toEqual([]);
    });

    it('should update package version on duplicate add', () => {
      const snippet = db.createSnippet({
        name: 'Python Snippet',
        language: 'python',
        code: 'import requests',
      });

      const pkg1 = db.addSnippetPackage(snippet.id, 'requests', '>=2.0.0');
      const pkg2 = db.addSnippetPackage(snippet.id, 'requests', '>=2.31.0');

      expect(pkg2.id).toBe(pkg1.id);
      expect(pkg2.packageVersion).toBe('>=2.31.0');

      const packages = db.getSnippetPackages(snippet.id);
      expect(packages.length).toBe(1);
      expect(packages[0].packageVersion).toBe('>=2.31.0');
    });

    it('should remove a package from a snippet', () => {
      const snippet = db.createSnippet({
        name: 'Python Snippet',
        language: 'python',
        code: 'import requests, numpy',
      });

      db.addSnippetPackage(snippet.id, 'requests');
      db.addSnippetPackage(snippet.id, 'numpy');

      db.removeSnippetPackage(snippet.id, 'requests');

      const packages = db.getSnippetPackages(snippet.id);
      expect(packages.length).toBe(1);
      expect(packages[0].packageName).toBe('numpy');
    });

    it('should clear all packages for a snippet', () => {
      const snippet = db.createSnippet({
        name: 'Python Snippet',
        language: 'python',
        code: 'import requests, numpy, pandas',
      });

      db.addSnippetPackage(snippet.id, 'requests');
      db.addSnippetPackage(snippet.id, 'numpy');
      db.addSnippetPackage(snippet.id, 'pandas');

      db.clearSnippetPackages(snippet.id);

      const packages = db.getSnippetPackages(snippet.id);
      expect(packages).toEqual([]);
    });

    it('should delete packages when snippet is deleted (cascade)', () => {
      const snippet = db.createSnippet({
        name: 'Python Snippet',
        language: 'python',
        code: 'import requests',
      });

      db.addSnippetPackage(snippet.id, 'requests');
      db.addSnippetPackage(snippet.id, 'numpy');

      db.deleteSnippet(snippet.id);

      const packages = db.getSnippetPackages(snippet.id);
      expect(packages).toEqual([]);
    });

    it('should handle packages for multiple snippets', () => {
      const snippet1 = db.createSnippet({
        name: 'Snippet 1',
        language: 'python',
        code: 'import requests',
      });

      const snippet2 = db.createSnippet({
        name: 'Snippet 2',
        language: 'python',
        code: 'import numpy',
      });

      db.addSnippetPackage(snippet1.id, 'requests');
      db.addSnippetPackage(snippet2.id, 'numpy');
      db.addSnippetPackage(snippet2.id, 'pandas');

      const packages1 = db.getSnippetPackages(snippet1.id);
      const packages2 = db.getSnippetPackages(snippet2.id);

      expect(packages1.length).toBe(1);
      expect(packages1[0].packageName).toBe('requests');

      expect(packages2.length).toBe(2);
      expect(packages2[0].packageName).toBe('numpy');
      expect(packages2[1].packageName).toBe('pandas');
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
