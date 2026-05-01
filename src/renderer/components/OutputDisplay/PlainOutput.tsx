import React from 'react';

interface PlainOutputProps {
  content: string;
}

export const PlainOutput: React.FC<PlainOutputProps> = ({ content }) => {
  return (
    <div
      style={{
        padding: '12px',
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
  );
};
