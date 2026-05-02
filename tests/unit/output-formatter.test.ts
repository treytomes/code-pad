import { describe, it, expect } from 'vitest';
import {
  detectOutputFormat,
  formatJSON,
  parseTableData,
  formatTable,
  formatOutput,
  splitOutputSections,
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

    it('should detect labeled JSON', () => {
      const labeledJson = '=== User Data ===\n{"name": "John", "age": 30}';
      expect(detectOutputFormat(labeledJson)).toBe('json');
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

    it('should handle labeled JSON', () => {
      const json = '=== Person Details ===\n{"name":"John","age":30}';
      const result = formatJSON(json);

      expect(result.format).toBe('json');
      expect(result.content).toContain('"name"');
      expect(result.metadata?.label).toBe('Person Details');
    });

    it('should convert array of objects to table', () => {
      const json = '[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]';
      const result = formatJSON(json);

      expect(result.format).toBe('table');
      expect(result.content).toContain('| id | name |');
      expect(result.content).toContain('| 1 | Alice |');
      expect(result.content).toContain('| 2 | Bob |');
      expect(result.metadata?.type).toBe('table');
      expect(result.metadata?.length).toBe(2);
    });

    it('should keep simple arrays as JSON', () => {
      const json = '[1, 2, 3, 4, 5]';
      const result = formatJSON(json);

      expect(result.format).toBe('json');
      expect(result.metadata?.type).toBe('array');
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

  describe('splitOutputSections', () => {
    it('should split output on blank lines', () => {
      const output = 'Section 1\n\nSection 2\n\nSection 3';
      const sections = splitOutputSections(output);

      expect(sections).toHaveLength(3);
      expect(sections[0]).toBe('Section 1');
      expect(sections[1]).toBe('Section 2');
      expect(sections[2]).toBe('Section 3');
    });

    it('should handle JSON and table sections', () => {
      const output = '{"name":"John"}\n\n| Name | Age |\n| John | 30 |';
      const sections = splitOutputSections(output);

      expect(sections).toHaveLength(2);
      expect(sections[0]).toBe('{"name":"John"}');
      expect(sections[1]).toContain('| Name | Age |');
    });

    it('should trim whitespace from sections', () => {
      const output = '  Section 1  \n\n  Section 2  ';
      const sections = splitOutputSections(output);

      expect(sections).toHaveLength(2);
      expect(sections[0]).toBe('Section 1');
      expect(sections[1]).toBe('Section 2');
    });

    it('should filter empty sections', () => {
      const output = 'Section 1\n\n\n\nSection 2';
      const sections = splitOutputSections(output);

      expect(sections).toHaveLength(2);
      expect(sections[0]).toBe('Section 1');
      expect(sections[1]).toBe('Section 2');
    });

    it('should return empty array for empty input', () => {
      expect(splitOutputSections('')).toEqual([]);
      expect(splitOutputSections('   ')).toEqual([]);
      expect(splitOutputSections('\n\n')).toEqual([]);
    });

    it('should handle single section without blank lines', () => {
      const output = 'Single section\nwith multiple lines\nbut no blank lines';
      const sections = splitOutputSections(output);

      expect(sections).toHaveLength(1);
      expect(sections[0]).toBe(output);
    });
  });
});
