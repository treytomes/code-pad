import React, { useMemo } from 'react';
import { Table } from 'antd';

interface TableOutputProps {
  content: string;
  metadata?: any;
}

export const TableOutput: React.FC<TableOutputProps> = ({ content, metadata }) => {
  const { columns, dataSource } = useMemo(() => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      return { columns: [], dataSource: [] };
    }

    // Parse markdown table
    const parseRow = (line: string) =>
      line
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0);

    const headerCells = parseRow(lines[0]);
    const cols = headerCells.map((header, index) => ({
      title: header,
      dataIndex: `col${index}`,
      key: `col${index}`,
      ellipsis: true,
    }));

    // Skip separator line (line 1)
    const dataRows = lines.slice(2).map((line, rowIndex) => {
      const cells = parseRow(line);
      const row: any = { key: rowIndex };
      cells.forEach((cell, colIndex) => {
        row[`col${colIndex}`] = cell;
      });
      return row;
    });

    return { columns: cols, dataSource: dataRows };
  }, [content]);

  if (columns.length === 0) {
    return (
      <div style={{ padding: '12px', color: '#858585' }}>
        <span style={{ fontStyle: 'italic' }}>Unable to parse table data</span>
        <pre style={{ marginTop: '8px', color: '#cccccc' }}>{content}</pre>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px' }}>
      {metadata?.label && (
        <div style={{ marginBottom: '12px', color: '#4ec9b0', fontSize: '14px', fontWeight: 'bold' }}>
          {metadata.label}
        </div>
      )}
      {metadata && (
        <div style={{ marginBottom: '12px', color: '#858585', fontSize: '12px' }}>
          {metadata.length} rows • {metadata.properties?.length || columns.length} columns
        </div>
      )}
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={dataSource.length > 20 ? { pageSize: 20 } : false}
        size="small"
        scroll={{ x: true }}
        style={{
          background: '#1e1e1e',
        }}
      />
    </div>
  );
};
