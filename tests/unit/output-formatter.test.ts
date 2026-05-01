import { describe, it, expect } from 'vitest';
import {
  detectOutputFormat,
  formatJSON,
  parseTableData,
  formatTable,
  formatOutput,
} from '../../src/backend/output-formatter';

describe('output-formatter', () => {
  describe('detectOutputFormat', () => {
    it('should detect JSON objects', () => {
      const jsonObj = '{"name": "John", "age": 30}';
      expect(detectOutputFormat(jsonObj)).toBe('json');
    });

    it('should detect JSON arrays', () => {
      const jsonArray = '[1, 2, 3, 4, 5]';
      expect(detectOutputFormat(jsonArray)).toBe('json');
    });

    it('should detect table with pipes', () => {
      const table = '| Name | Age |\n| John | 30 |\n| Jane | 25 |';
      expect(detectOutputFormat(table)).toBe('table');
    });

    it('should detect table with tabs', () => {
      const table = 'Name\tAge\nJohn\t30\nJane\t25';
      expect(detectOutputFormat(table)).toBe('table');
    });

    it('should detect plain text', () => {
      const plain = 'Hello, World!';
      expect(detectOutputFormat(plain)).toBe('plain');
    });
  });

  describe('formatJSON', () => {
    it('should format valid JSON', () => {
      const json = '{"name":"John","age":30}';
      const result = formatJSON(json);

      expect(result.format).toBe('json');
      expect(result.content).toContain('"name"');
      expect(result.content).toContain('"age"');
      expect(result.metadata?.type).toBe('object');
    });

    it('should handle JSON arrays', () => {
      const json = '[1,2,3]';
      const result = formatJSON(json);

      expect(result.format).toBe('json');
      expect(result.metadata?.type).toBe('array');
      expect(result.metadata?.length).toBe(3);
    });

    it('should return plain for invalid JSON', () => {
      const invalid = '{invalid json}';
      const result = formatJSON(invalid);

      expect(result.format).toBe('plain');
    });
  });

  describe('parseTableData', () => {
    it('should parse pipe-delimited table', () => {
      const table = '| Name | Age |\n|----|----|\n| John | 30 |\n| Jane | 25 |';
      const result = parseTableData(table);

      expect(result).not.toBeNull();
      expect(result?.headers).toEqual(['Name', 'Age']);
      expect(result?.rows).toHaveLength(2);
      expect(result?.rows[0]).toEqual(['John', '30']);
    });

    it('should parse tab-delimited table', () => {
      const table = 'Name\tAge\nJohn\t30\nJane\t25';
      const result = parseTableData(table);

      expect(result).not.toBeNull();
      expect(result?.headers).toEqual(['Name', 'Age']);
      expect(result?.rows).toHaveLength(2);
    });

    it('should return null for non-table data', () => {
      const notTable = 'This is just plain text';
      const result = parseTableData(notTable);

      expect(result).toBeNull();
    });
  });

  describe('formatTable', () => {
    it('should format table as markdown', () => {
      const headers = ['Name', 'Age'];
      const rows = [['John', '30'], ['Jane', '25']];
      const result = formatTable(headers, rows);

      expect(result.format).toBe('table');
      expect(result.content).toContain('| Name');
      expect(result.content).toContain('| Age');
      expect(result.content).toContain('---');
      expect(result.metadata?.length).toBe(2);
    });
  });

  describe('formatOutput (integration)', () => {
    it('should auto-detect and format JSON', () => {
      const json = '{"name": "John", "age": 30}';
      const result = formatOutput(json);

      expect(result.format).toBe('json');
      expect(result.content).toContain('"name"');
    });

    it('should auto-detect and format tables', () => {
      const table = '| Name | Age |\n|----|----|\n| John | 30 |';
      const result = formatOutput(table);

      expect(result.format).toBe('table');
      expect(result.content).toContain('Name');
    });

    it('should fallback to plain text', () => {
      const plain = 'Hello, World!\nThis is plain text.';
      const result = formatOutput(plain);

      expect(result.format).toBe('plain');
      expect(result.content).toBe(plain);
    });
  });
});
