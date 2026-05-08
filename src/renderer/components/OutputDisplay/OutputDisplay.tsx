import React, { useMemo, useRef, useCallback } from 'react';
import { Divider } from 'antd';
import { VariableSizeList as List } from 'react-window';
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
import { SLOT_PREFIX } from '../../../backend/containers';

// Threshold for enabling virtual scrolling (number of sections)
const VIRTUALIZATION_THRESHOLD = 100;

interface OutputDisplayProps {
  output: string;
  progressEvents?: ProgressEvent[];
  containerContents?: Map<string, string>;
}

const OutputSection: React.FC<{ formatted: FormattedOutput }> = ({ formatted }) => {
  // Check if this is a horizontal rule marker
  if (formatted.format === 'plain' && formatted.content === '___HR___') {
    return <Divider style={{ margin: '16px 0', borderColor: '#434343' }} />;
  }

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
      return <PlainOutput content={formatted.content} metadata={formatted.metadata} />;
  }
};

export const OutputDisplay: React.FC<OutputDisplayProps> = ({
  output,
  progressEvents = [],
  containerContents = new Map(),
}) => {
  const listRef = useRef<List>(null);
  const sectionHeightsRef = useRef<Map<number, number>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = React.useState(600);

  // Observe container size changes
  React.useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  const sections = useMemo<FormattedOutput[]>(() => {
    if (!output || !output.trim()) {
      return [{ format: 'plain', content: '' }];
    }

    // Split output into sections and format each independently
    const outputSections = splitOutputSections(output);

    // If no sections, format the whole output as one
    if (outputSections.length === 0) {
      return [formatOutput(output)];
    }

    return outputSections.map((section) => {
      // Slot placeholder: render the current container content (or a spinner)
      if (section.startsWith(SLOT_PREFIX)) {
        const id = section.slice(SLOT_PREFIX.length);
        const content = containerContents.get(id);
        if (content === undefined) {
          return { format: 'plain', content: '…' } as FormattedOutput;
        }
        return formatOutput(content);
      }
      return formatOutput(section);
    });
  }, [output, containerContents]);

  // Estimate height for each section based on format and content
  const getItemSize = useCallback(
    (index: number): number => {
      // Return cached height if available
      const cached = sectionHeightsRef.current.get(index);
      if (cached) return cached;

      const section = sections[index];
      if (!section) return 100; // Fallback

      // Estimate based on format
      let estimatedHeight = 50; // Base height

      switch (section.format) {
        case 'json': {
          const lines = section.content.split('\n').length;
          estimatedHeight = Math.min(lines * 20 + 40, 600); // Max 600px for collapsed JSON
          break;
        }
        case 'table': {
          const lines = section.content.split('\n').length;
          estimatedHeight = lines * 32 + 60; // Row height + header + padding
          break;
        }
        case 'image':
        case 'svg':
          estimatedHeight = 300; // Default image height
          break;
        case 'html':
          estimatedHeight = 100;
          break;
        case 'plain':
        default: {
          const lines = section.content.split('\n').length;
          estimatedHeight = lines * 20 + 24; // Line height + padding
          break;
        }
      }

      // Add divider height (except for first item)
      if (index > 0) {
        estimatedHeight += 32; // Divider margin + height
      }

      return estimatedHeight;
    },
    [sections]
  );

  // Reset section heights when output changes
  React.useEffect(() => {
    sectionHeightsRef.current.clear();
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
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

  // Use virtual scrolling for large outputs
  if (sections.length >= VIRTUALIZATION_THRESHOLD) {
    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const contentKey = `${sections[index].format}-${sections[index].metadata?.label ?? ''}-${index}`;
      return (
        <div style={style} key={contentKey}>
          {index > 0 && <Divider style={{ margin: '16px 0', borderColor: '#434343' }} />}
          <OutputSection formatted={sections[index]} />
        </div>
      );
    };

    return (
      <div ref={containerRef} style={{ height: '100%', width: '100%' }}>
        {progressBar}
        <List
          ref={listRef}
          height={containerHeight}
          itemCount={sections.length}
          itemSize={getItemSize}
          width="100%"
          overscanCount={5}
        >
          {Row}
        </List>
      </div>
    );
  }

  // Small output - render all sections without virtualization
  return (
    <div>
      {progressBar}
      {sections.map((formatted, index) => {
        // Generate stable key based on content to avoid React reuse issues
        const contentKey = `${formatted.format}-${formatted.metadata?.label ?? ''}-${index}`;
        return (
          <React.Fragment key={contentKey}>
            {index > 0 && <Divider style={{ margin: '16px 0', borderColor: '#434343' }} />}
            <OutputSection formatted={formatted} />
          </React.Fragment>
        );
      })}
    </div>
  );
};
