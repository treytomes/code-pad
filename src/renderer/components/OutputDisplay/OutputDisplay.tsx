import React, { useMemo } from 'react';
import { Divider } from 'antd';
import { JsonOutput } from './JsonOutput';
import { TableOutput } from './TableOutput';
import { PlainOutput } from './PlainOutput';
import { ImageOutput } from './ImageOutput';
import { ProgressBar } from './ProgressBar';
import {
  formatOutput,
  FormattedOutput,
  splitOutputSections,
} from '../../../backend/output-formatter';
import type { ProgressEvent } from '../../../backend/progress';

interface OutputDisplayProps {
  output: string;
  progressEvents?: ProgressEvent[];
}

const OutputSection: React.FC<{ formatted: FormattedOutput }> = ({ formatted }) => {
  switch (formatted.format) {
    case 'json':
      return <JsonOutput content={formatted.content} metadata={formatted.metadata} />;

    case 'table':
      return <TableOutput content={formatted.content} metadata={formatted.metadata} />;

    case 'svg':
    case 'image':
      return (
        <ImageOutput
          content={formatted.content}
          format={formatted.format as 'image' | 'svg'}
          metadata={formatted.metadata}
        />
      );

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

export const OutputDisplay: React.FC<OutputDisplayProps> = ({ output, progressEvents = [] }) => {
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

  const progressBar = progressEvents.length > 0 ? <ProgressBar events={progressEvents} /> : null;

  if (sections.length === 0 || (sections.length === 1 && !sections[0].content)) {
    return progressBar ? <div>{progressBar}</div> : <PlainOutput content="" />;
  }

  // Single section - render without dividers
  if (sections.length === 1) {
    return (
      <div>
        {progressBar}
        <OutputSection formatted={sections[0]} />
      </div>
    );
  }

  // Multiple sections - render with dividers between
  return (
    <div>
      {progressBar}
      {sections.map((formatted, index) => (
        <React.Fragment key={index}>
          {index > 0 && <Divider style={{ margin: '16px 0', borderColor: '#434343' }} />}
          <OutputSection formatted={formatted} />
        </React.Fragment>
      ))}
    </div>
  );
};
