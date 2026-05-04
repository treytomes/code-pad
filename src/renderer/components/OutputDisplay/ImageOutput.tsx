import React from 'react';

interface ImageOutputProps {
  content: string;
  format: 'image' | 'svg';
  metadata?: { label?: string };
}

export const ImageOutput: React.FC<ImageOutputProps> = ({ content, format, metadata }) => {
  return (
    <div style={{ padding: '12px' }}>
      {metadata?.label && (
        <div
          style={{ marginBottom: '12px', color: '#4ec9b0', fontSize: '14px', fontWeight: 'bold' }}
        >
          {metadata.label}
        </div>
      )}
      {format === 'svg' ? (
        <div
          style={{ maxWidth: '100%', overflow: 'auto' }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <img
          src={content}
          alt={metadata?.label ?? 'output image'}
          style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
        />
      )}
    </div>
  );
};
