import React, { useMemo } from 'react';
import { JsonOutput } from './JsonOutput';
import { TableOutput } from './TableOutput';
import { PlainOutput } from './PlainOutput';
import { formatOutput, FormattedOutput } from '../../../backend/output-formatter';

interface OutputDisplayProps {
  output: string;
}

export const OutputDisplay: React.FC<OutputDisplayProps> = ({ output }) => {
  const formatted = useMemo<FormattedOutput>(() => {
    if (!output || !output.trim()) {
      return { format: 'plain', content: '' };
    }
    return formatOutput(output);
  }, [output]);

  switch (formatted.format) {
    case 'json':
      return <JsonOutput content={formatted.content} metadata={formatted.metadata} />;

    case 'table':
      return <TableOutput content={formatted.content} metadata={formatted.metadata} />;

    case 'html':
      return (
        <div
          style={{
            padding: '12px',
            color: '#cccccc',
          }}
          dangerouslySetInnerHTML={{ __html: formatted.content }}
        />
      );

    case 'plain':
    default:
      return <PlainOutput content={formatted.content} />;
  }
};
