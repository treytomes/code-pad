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

    it('should detect SVG markup', () => {
      const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><circle cx='50' cy='50' r='40'/></svg>";
      expect(detectOutputFormat(svg)).toBe('svg');
    });

    it('should detect SVG with label', () => {
      const labeled = "=== My Chart ===\n<svg xmlns='http://www.w3.org/2000/svg'><rect/></svg>";
      expect(detectOutputFormat(labeled)).toBe('svg');
    });

    it('should detect PNG base-64', () => {
      // iVBORw0KGgo... is the base-64 prefix of a PNG header
      expect(detectOutputFormat('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ')).toBe('image');
    });

    it('should detect JPEG base-64', () => {
      expect(detectOutputFormat('/9j/4AAQSkZJRgABAQEASABIAAD')).toBe('image');
    });

    it('should detect data URI image', () => {
      expect(detectOutputFormat('data:image/png;base64,iVBORw0KGgo=')).toBe('image');
    });

    it('should detect base-64 image with label', () => {
      const labeled = '=== Photo ===\niVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ';
      expect(detectOutputFormat(labeled)).toBe('image');
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

    it('should render primitive arrays as a single-column table', () => {
      const json = '[1, 2, 3, 4, 5]';
      const result = formatJSON(json);

      expect(result.format).toBe('table');
      expect(result.content).toContain('| Value |');
      expect(result.content).toContain('| 1 |');
      expect(result.content).toContain('| 5 |');
      expect(result.metadata?.length).toBe(5);
    });

    it('should render string arrays as a single-column table', () => {
      const json = '["alpha", "beta", "gamma"]';
      const result = formatJSON(json);

      expect(result.format).toBe('table');
      expect(result.content).toContain('| Value |');
      expect(result.content).toContain('| alpha |');
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
      const rows = [
        ['John', '30'],
        ['Jane', '25'],
      ];
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

    it('should format SVG and strip script tags', () => {
      const svg = "<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script><rect/></svg>";
      const result = formatOutput(svg);

      expect(result.format).toBe('svg');
      expect(result.content).not.toContain('<script>');
      expect(result.content).toContain('<rect/>');
    });

    it('should format labeled SVG and expose label in metadata', () => {
      const labeled = "=== Bar Chart ===\n<svg xmlns='http://www.w3.org/2000/svg'><rect/></svg>";
      const result = formatOutput(labeled);

      expect(result.format).toBe('svg');
      expect(result.metadata?.label).toBe('Bar Chart');
      expect(result.content).toContain('<svg');
    });

    it('should format PNG base-64 as data URI', () => {
      const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ';
      const result = formatOutput(b64);

      expect(result.format).toBe('image');
      expect(result.content).toMatch(/^data:image\/png;base64,/);
    });

    it('should pass through existing data URI unchanged', () => {
      const uri = 'data:image/jpeg;base64,/9j/4AAQ==';
      const result = formatOutput(uri);

      expect(result.format).toBe('image');
      expect(result.content).toBe(uri);
    });

    it('should format labeled image and expose label in metadata', () => {
      const labeled = '=== Sales Chart ===\niVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ';
      const result = formatOutput(labeled);

      expect(result.format).toBe('image');
      expect(result.metadata?.label).toBe('Sales Chart');
      expect(result.content).toMatch(/^data:image\/png;base64,/);
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

    it('should split .Dump() section from following Console.WriteLine output (regression)', () => {
      // Regression: DumpObject used to emit a blank line only BEFORE each dump
      // (except the first). If Console.WriteLine followed the last .Dump(), there
      // was no trailing blank line, so the plain-text output merged into the same
      // section and prevented JSON detection.
      // Fix: DumpObject now always emits a trailing blank line after the JSON body.
      const activeUsers = JSON.stringify(
        [
          { Id: 1, Name: 'Alice', Role: 'Admin', Active: true },
          { Id: 2, Name: 'Bob', Role: 'Developer', Active: true },
        ],
        null,
        2
      );
      // DumpObject with the fix: trailing blank line after JSON
      const output = `=== Active Users ===\n${activeUsers}\n\nActive: Alice, Bob\n`;

      const sections = splitOutputSections(output);
      expect(sections).toHaveLength(2);
      expect(sections[0]).toMatch(/^=== Active Users ===/);
      // The .Dump() section must be detected as a table, not plain text
      const result = formatOutput(sections[0]);
      expect(result.format).toBe('table');
      expect(result.metadata?.label).toBe('Active Users');
      // The plain-text line must be its own section
      expect(sections[1]).toBe('Active: Alice, Bob');
    });

    it('should not split inside indented JSON arrays (LINQ pipeline bug)', () => {
      // Simulates four .Dump() calls with labels — the exact output produced by
      // DumpExtensions when running the LINQ Pipeline Chaining sample.
      // WriteIndented=true produces multiline JSON; blank lines come from the
      // Console.WriteLine() separator between sections, not inside JSON itself.
      const allProducts = JSON.stringify(
        [
          { Id: 1, Name: 'Laptop', Price: 999.99, Category: 'Electronics', InStock: true },
          { Id: 2, Name: 'Mouse', Price: 29.99, Category: 'Electronics', InStock: true },
        ],
        null,
        2
      );
      const electronics = JSON.stringify(
        [{ Id: 1, Name: 'Laptop', Price: 999.99, Category: 'Electronics', InStock: true }],
        null,
        2
      );

      // DumpObject emits: label line + JSON + trailing blank line (always).
      const output =
        `=== All Products ===\n${allProducts}\n\n` +
        `=== Electronics Only ===\n${electronics}\n\n`;

      const sections = splitOutputSections(output);
      expect(sections).toHaveLength(2);
      expect(sections[0]).toMatch(/^=== All Products ===/);
      expect(sections[1]).toMatch(/^=== Electronics Only ===/);
    });

    it('should parse labeled JSON section as table (LINQ pipeline integration)', () => {
      const products = JSON.stringify(
        [
          { Id: 1, Name: 'Laptop', Price: 999.99, Category: 'Electronics', InStock: true },
          { Id: 2, Name: 'Mouse', Price: 29.99, Category: 'Electronics', InStock: true },
        ],
        null,
        2
      );
      const section = `=== All Products ===\n${products}`;
      const result = formatOutput(section);

      expect(result.format).toBe('table');
      expect(result.metadata?.label).toBe('All Products');
      expect(result.content).toContain('| Id | Name | Price | Category | InStock |');
    });

    it('should produce 4 table sections for full LINQ pipeline output', () => {
      // Full output produced by the LINQ Pipeline Chaining sample script.
      // Each .Dump() emits a blank-line separator (except the first), then
      // "=== Label ===\n" + indented JSON + trailing newline.
      const products = [
        { Id: 1, Name: 'Laptop', Price: 999.99, Category: 'Electronics', InStock: true },
        { Id: 2, Name: 'Mouse', Price: 29.99, Category: 'Electronics', InStock: true },
        { Id: 3, Name: 'Desk', Price: 299.99, Category: 'Furniture', InStock: false },
        { Id: 4, Name: 'Chair', Price: 199.99, Category: 'Furniture', InStock: true },
        { Id: 5, Name: 'Monitor', Price: 349.99, Category: 'Electronics', InStock: true },
      ];
      const electronics = products.filter((p) => p.Category === 'Electronics');
      const expensive = electronics.filter((p) => p.Price > 100);
      const sorted = [...expensive].sort((a, b) => b.Price - a.Price);

      // DumpObject always appends a trailing blank line after the JSON body
      function makeDump(obj: unknown, label: string): string {
        return `=== ${label} ===\n${JSON.stringify(obj, null, 2)}\n\n`;
      }

      const fullOutput =
        makeDump(products, 'All Products') +
        makeDump(electronics, 'Electronics Only') +
        makeDump(expensive, 'Expensive Electronics') +
        makeDump(sorted, 'Sorted by Price');

      const sections = splitOutputSections(fullOutput);
      expect(sections).toHaveLength(4);
      expect(sections[0]).toMatch(/^=== All Products ===/);
      expect(sections[1]).toMatch(/^=== Electronics Only ===/);
      expect(sections[2]).toMatch(/^=== Expensive Electronics ===/);
      expect(sections[3]).toMatch(/^=== Sorted by Price ===/);

      // Each section should format as a table
      sections.forEach((section) => {
        const result = formatOutput(section);
        expect(result.format).toBe('table');
        expect(result.metadata?.type).toBe('table');
      });
    });
  });
});
