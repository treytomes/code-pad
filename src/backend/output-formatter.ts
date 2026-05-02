/**
 * Output formatting utilities for rich display of objects, arrays, and data structures
 */

export type OutputFormat = 'plain' | 'json' | 'table' | 'html';

export interface FormattedOutput {
  format: OutputFormat;
  content: string;
  metadata?: {
    type?: string;
    length?: number;
    properties?: string[];
    label?: string;
  };
}

/**
 * Detect the format of output from C# code
 */
export function detectOutputFormat(output: string): OutputFormat {
  const trimmed = output.trim();

  // Check for labeled output (e.g., "=== Label ===\n{...}")
  // Strip label lines before format detection
  let contentToCheck = trimmed;
  const labelMatch = trimmed.match(/^===\s+.+?\s+===\s*\n(.+)/s);
  if (labelMatch) {
    contentToCheck = labelMatch[1].trim();
  }

  // Check for JSON
  if ((contentToCheck.startsWith('{') && contentToCheck.endsWith('}')) ||
      (contentToCheck.startsWith('[') && contentToCheck.endsWith(']'))) {
    try {
      JSON.parse(contentToCheck);
      return 'json';
    } catch {
      // Not valid JSON
    }
  }

  // Check for HTML
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    if (trimmed.includes('<!DOCTYPE') || trimmed.includes('<html') ||
        trimmed.includes('<div') || trimmed.includes('<table')) {
      return 'html';
    }
  }

  // Check for tabular data (TSV/CSV-like)
  const lines = trimmed.split('\n');
  if (lines.length > 1) {
    const firstLine = lines[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const pipeCount = (firstLine.match(/\|/g) || []).length;

    if (tabCount > 0 || pipeCount > 1) {
      // Check if subsequent lines have similar structure
      const hasConsistentSeparators = lines.slice(1, Math.min(5, lines.length))
        .every(line => {
          const lineTabs = (line.match(/\t/g) || []).length;
          const linePipes = (line.match(/\|/g) || []).length;
          return lineTabs === tabCount || linePipes === pipeCount;
        });

      if (hasConsistentSeparators) {
        return 'table';
      }
    }
  }

  return 'plain';
}

/**
 * Format JSON with syntax highlighting markers
 * Handles labeled JSON (e.g., "=== Label ===\n{...}")
 */
export function formatJSON(json: string, indent: number = 2): FormattedOutput {
  try {
    // Check for label and extract it
    let label: string | undefined;
    let jsonContent = json;

    const labelMatch = json.match(/^===\s+(.+?)\s+===\s*\n(.+)/s);
    if (labelMatch) {
      label = labelMatch[1];
      jsonContent = labelMatch[2].trim();
    }

    const parsed = JSON.parse(jsonContent);
    const formatted = JSON.stringify(parsed, null, indent);

    return {
      format: 'json',
      content: formatted,
      metadata: {
        type: Array.isArray(parsed) ? 'array' : 'object',
        length: Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length,
        label, // Include label in metadata
      },
    };
  } catch (_error) {
    return {
      format: 'plain',
      content: json,
    };
  }
}

/**
 * Parse table-like output into structured data
 */
export function parseTableData(output: string): {
  headers: string[];
  rows: string[][];
  separator: string;
} | null {
  const lines = output.trim().split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    return null;
  }

  // Detect separator (tab or pipe)
  const firstLine = lines[0];
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const pipeCount = (firstLine.match(/\|/g) || []).length;

  let separator: string;
  if (tabCount > 0) {
    separator = '\t';
  } else if (pipeCount > 1) {
    separator = '|';
  } else {
    return null;
  }

  // Parse headers
  const headers = firstLine
    .split(separator)
    .map(h => h.trim())
    .filter(h => h.length > 0);

  // Skip separator line if exists (markdown-style tables)
  let dataStartIndex = 1;
  if (lines.length > 1 && lines[1].includes('---') || lines[1].includes('===')) {
    dataStartIndex = 2;
  }

  // Parse rows
  const rows = lines.slice(dataStartIndex).map(line =>
    line
      .split(separator)
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0) // Remove empty cells from leading/trailing separators
      .slice(0, headers.length) // Only take as many cells as headers
  );

  return { headers, rows, separator };
}

/**
 * Format table data as markdown table
 */
export function formatTable(headers: string[], rows: string[][]): FormattedOutput {
  const columnWidths = headers.map((header, colIdx) => {
    const cellWidths = rows.map(row => (row[colIdx] || '').length);
    return Math.max(header.length, ...cellWidths, 3); // Minimum width of 3
  });

  const formatRow = (cells: string[]) =>
    '| ' +
    cells
      .map((cell, idx) => cell.padEnd(columnWidths[idx]))
      .join(' | ') +
    ' |';

  const headerRow = formatRow(headers);
  const separatorRow =
    '| ' +
    columnWidths.map(width => '-'.repeat(width)).join(' | ') +
    ' |';
  const dataRows = rows.map(row => formatRow(row));

  const content = [headerRow, separatorRow, ...dataRows].join('\n');

  return {
    format: 'table',
    content,
    metadata: {
      type: 'table',
      length: rows.length,
      properties: headers,
    },
  };
}

/**
 * Split output into sections separated by blank lines
 * Each section can have its own format (JSON, table, plain text)
 */
export function splitOutputSections(output: string): string[] {
  if (!output || !output.trim()) {
    return [];
  }

  // Split on double newlines (blank lines) to separate sections
  const sections = output.split(/\n\s*\n/);

  return sections
    .map(section => section.trim())
    .filter(section => section.length > 0);
}

/**
 * Main formatting function - auto-detect and format output
 */
export function formatOutput(output: string): FormattedOutput {
  const format = detectOutputFormat(output);

  switch (format) {
    case 'json':
      return formatJSON(output);

    case 'table': {
      const tableData = parseTableData(output);
      if (tableData) {
        return formatTable(tableData.headers, tableData.rows);
      }
      break;
    }

    case 'html':
      return {
        format: 'html',
        content: output,
      };

    case 'plain':
    default:
      break;
  }

  return {
    format: 'plain',
    content: output,
  };
}
