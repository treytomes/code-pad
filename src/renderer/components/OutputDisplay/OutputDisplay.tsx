import React, { useMemo } from 'react';
import { Divider } from 'antd';
import { JsonOutput } from './JsonOutput';
import { TableOutput } from './TableOutput';
import { PlainOutput } from './PlainOutput';
import {
  formatOutput,
  FormattedOutput,
  splitOutputSections,
} from '../../../backend/output-formatter';

interface OutputDisplayProps {
  output: string;
}

const OutputSection: React.FC<{ formatted: FormattedOutput }> = ({ formatted }) => {
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

export const OutputDisplay: React.FC<OutputDisplayProps> = ({ output }) => {
  const sections = useMemo<FormattedOutput[]>(() => {
    if (!output || !output.trim()) {
      return [{ format: 'plain', content: '' }];
    }

    // Split output into sections and format each independently
    const outputSections = splitOutputSections(output);

    // If no sections (single output), format as one
    if (outputSections.length === 0) {
      return [formatOutput(output)];
    }

    // If only one section, check if it's the entire output
    // (avoid splitting when there's no blank line separation)
    if (outputSections.length === 1 && outputSections[0] === output.trim()) {
      return [formatOutput(output)];
    }

    return outputSections.map((section) => formatOutput(section));
  }, [output]);

  if (sections.length === 0 || (sections.length === 1 && !sections[0].content)) {
    return <PlainOutput content="" />;
  }

  // Single section - render without dividers
  if (sections.length === 1) {
    return <OutputSection formatted={sections[0]} />;
  }

  // Multiple sections - render with dividers between
  return (
    <div>
      {sections.map((formatted, index) => (
        <React.Fragment key={index}>
          {index > 0 && <Divider style={{ margin: '16px 0', borderColor: '#434343' }} />}
          <OutputSection formatted={formatted} />
        </React.Fragment>
      ))}
    </div>
  );
};
