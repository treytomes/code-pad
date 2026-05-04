import React from 'react';

interface PlainOutputProps {
  content: string;
  metadata?: { label?: string };
}

export const PlainOutput: React.FC<PlainOutputProps> = ({ content, metadata }) => {
  return (
    <div style={{ padding: '12px' }}>
      {metadata?.label && (
        <div style={{ marginBottom: '8px', color: '#4ec9b0', fontSize: '14px', fontWeight: 'bold' }}>
          {metadata.label}
        </div>
      )}
      <div
        style={{
          color: '#cccccc',
          fontFamily: "'Consolas', 'Courier New', monospace",
          fontSize: '13px',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {content || <span style={{ color: '#858585', fontStyle: 'italic' }}>No output</span>}
      </div>
    </div>
  );
};
